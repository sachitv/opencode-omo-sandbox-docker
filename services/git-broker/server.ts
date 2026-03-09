import cors from "cors";
import express from "express";
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import path from "node:path";

const execFileAsync = promisify(execFile);

const bindAddress = process.env.HOST || "0.0.0.0";
const port = Number.parseInt(process.env.PORT || "8082", 10);
const repoPath = process.env.REPO_PATH || "/repo";
const stateDir = process.env.AGENT_STATE_DIR || "/host-agent-state";
const keyDir = process.env.AGENT_KEY_DIR || "/host-agent-keys";

type GitResult = {
  stdout: string;
  stderr: string;
};

type PolicyState = {
  repo: string;
  origin: string;
  branch: string;
};

type LivePolicy = {
  repo: string;
  origin: string;
  branch: string;
  allowedBranch: string;
  head: string;
  privateKeyPath: string;
};

type ForceMode = "none" | "force-with-lease" | "force";

type GitRunner = (args: string[], extraEnv?: NodeJS.ProcessEnv) => Promise<GitResult>;

function canonicalizeRemote(remote: string): string {
  const trimmed = remote.trim();
  const scpMatch = trimmed.match(/^git@github\.com:(.+?)(?:\.git)?$/i);
  if (scpMatch) {
    return `github.com/${scpMatch[1]}`;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.hostname.toLowerCase() === "github.com") {
      return `github.com/${parsed.pathname.replace(/^\/+/, "").replace(/\.git$/, "")}`;
    }
  } catch {
    // Leave unknown formats untouched for direct comparison.
  }

  return trimmed.replace(/\.git$/, "");
}

async function git(args: string[], extraEnv: NodeJS.ProcessEnv = {}): Promise<GitResult> {
  const { stdout, stderr } = await execFileAsync("git", args, {
    cwd: repoPath,
    env: {
      ...process.env,
      ...extraEnv,
    },
  });

  return {
    stdout: stdout.trim(),
    stderr: stderr.trim(),
  };
}

export async function loadPolicyWithDeps(
  activeRepoPath: string,
  activeStateDir: string,
  activeKeyDir: string,
  gitRunner: GitRunner,
  readFile: typeof fs.readFile = fs.readFile,
  access: typeof fs.access = fs.access,
): Promise<LivePolicy> {
  const { stdout: remote } = await gitRunner(["remote", "get-url", "origin"]);
  const { stdout: branch } = await gitRunner(["rev-parse", "--abbrev-ref", "HEAD"]);
  const { stdout: head } = await gitRunner(["rev-parse", "HEAD"]);
  const canonicalRemote = canonicalizeRemote(remote);
  const repo = canonicalRemote.replace(/^github\.com\//, "");

  if (!repo.includes("/")) {
    throw new Error(`Unable to derive owner/repo from origin '${remote}'`);
  }

  const stateBase = repo.replace("/", "__");
  const statePath = path.join(activeStateDir, `${stateBase}.json`);
  const rawState = await readFile(statePath, "utf8");
  const state = JSON.parse(rawState) as PolicyState;

  const recordedRemote = canonicalizeRemote(state.origin || "");
  if (recordedRemote !== canonicalRemote) {
    throw new Error(`Origin mismatch: recorded '${recordedRemote}', live '${canonicalRemote}'`);
  }

  if (state.repo !== repo) {
    throw new Error(`State repo '${state.repo}' does not match live repo '${repo}'`);
  }

  const privateKey = path.basename((state as PolicyState & { private_key?: string }).private_key || stateBase);
  const mountedPrivateKey = path.join(activeKeyDir, privateKey);
  await access(mountedPrivateKey);

  return {
    repo,
    origin: canonicalRemote,
    branch,
    allowedBranch: state.branch,
    head,
    privateKeyPath: mountedPrivateKey,
  };
}

async function loadPolicy(): Promise<LivePolicy> {
  return loadPolicyWithDeps(repoPath, stateDir, keyDir, git);
}

export function gitSshCommand(privateKeyPath: string): string {
  // GitHub supports SSH over port 443 via ssh.github.com, which is more
  // reliable in locked-down environments than raw outbound port 22.
  return `ssh -o BatchMode=yes -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new -o HostName=ssh.github.com -p 443 -i ${privateKeyPath}`;
}

export function buildFetchArgs(prune: boolean, refspecs: string[]): string[] {
  const args = ["fetch"];
  if (prune) {
    args.push("--prune");
  }

  args.push("origin", ...refspecs);
  return args;
}

export function buildPushArgs(policy: LivePolicy, forceMode: ForceMode, expectedCommit?: string): string[] {
  if (policy.branch !== policy.allowedBranch) {
    throw new Error(`Current branch '${policy.branch}' does not match locked branch '${policy.allowedBranch}'`);
  }

  if (expectedCommit && expectedCommit !== policy.head) {
    throw new Error(`HEAD is '${policy.head}', expected '${expectedCommit}'`);
  }

  const args = ["push"];
  if (forceMode === "force-with-lease") {
    args.push("--force-with-lease");
  } else if (forceMode === "force") {
    args.push("--force");
  }

  args.push("origin", `HEAD:refs/heads/${policy.allowedBranch}`);
  return args;
}

function createGitBrokerServer(): McpServer {
  const server = new McpServer({
    name: "git-broker",
    version: "1.0.0",
  });

  server.tool(
    "describe_push_policy",
    "Return the locked repository, origin, allowed branch, current branch, and HEAD that the git broker will allow.",
    {},
    async () => {
      const policy = await loadPolicy();
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(policy, null, 2),
          },
        ],
      };
    },
  );

  server.tool(
    "fetch_origin",
    "Fetch from origin for the locked repository using the dedicated deploy key. Supports pruning and explicit refspecs.",
    {
      prune: z.boolean().optional(),
      refspecs: z.array(z.string()).optional(),
    },
    async ({ prune = false, refspecs = [] }) => {
      const policy = await loadPolicy();
      const args = buildFetchArgs(prune, refspecs);

      const result = await git(args, {
        GIT_SSH_COMMAND: gitSshCommand(policy.privateKeyPath),
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                repo: policy.repo,
                origin: policy.origin,
                branch: policy.allowedBranch,
                head: policy.head,
                prune,
                refspecs,
                stdout: result.stdout,
                stderr: result.stderr,
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  server.tool(
    "push_current_head",
    "Push the repository's current HEAD to the locked branch on origin. Supports normal push, force-with-lease, and force.",
    {
      force_mode: z.enum(["none", "force-with-lease", "force"]).optional(),
      expected_commit: z.string().optional(),
    },
    async ({ force_mode = "none", expected_commit }) => {
      const policy = await loadPolicy();
      const args = buildPushArgs(policy, force_mode, expected_commit);

      const result = await git(args, {
        GIT_SSH_COMMAND: gitSshCommand(policy.privateKeyPath),
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                repo: policy.repo,
                origin: policy.origin,
                branch: policy.allowedBranch,
                head: policy.head,
                force_mode,
                stdout: result.stdout,
                stderr: result.stderr,
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  return server;
}

export function createApp(): express.Express {
  const app = express();

  app.use(
    cors({
      origin: true,
      exposedHeaders: ["Mcp-Session-Id", "mcp-protocol-version"],
      allowedHeaders: ["Content-Type", "mcp-session-id"],
    }),
  );
  app.use(express.json());

  app.all("/mcp", async (req, res) => {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });

    const server = createGitBrokerServer();

    res.on("close", () => {
      transport.close();
    });

    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: { code: -32603, message: String(error) },
          id: null,
        });
      }
    } finally {
      await server.close().catch(() => {});
    }
  });

  app.get("/health", async (_req, res) => {
    try {
      const policy = await loadPolicy();
      res.json({ status: "ok", service: "git-broker", repo: policy.repo, branch: policy.allowedBranch });
    } catch (error) {
      res.status(500).json({ status: "error", error: String(error) });
    }
  });

  return app;
}

if (import.meta.main) {
  const app = createApp();
  app.listen(port, bindAddress, () => {
    console.log(`Git broker MCP listening on http://${bindAddress}:${port}/mcp`);
  });
}

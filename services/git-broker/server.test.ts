import { describe, expect, test } from "bun:test";
import { buildFetchArgs, buildPushArgs, gitSshCommand, loadPolicyWithDeps } from "./server";

describe("git broker smoke tests", () => {
  test("loadPolicyWithDeps validates recorded state and returns live policy", async () => {
    const calls: string[][] = [];
    const git = async (args: string[]) => {
      calls.push(args);
      if (args.join(" ") === "remote get-url origin") {
        return { stdout: "git@github.com:owner/repo.git", stderr: "" };
      }
      if (args.join(" ") === "rev-parse --abbrev-ref HEAD") {
        return { stdout: "main", stderr: "" };
      }
      if (args.join(" ") === "rev-parse HEAD") {
        return { stdout: "abc123", stderr: "" };
      }
      throw new Error(`Unexpected git args: ${args.join(" ")}`);
    };

    const policy = await loadPolicyWithDeps(
      "/repo",
      "/host-agent-state",
      "/host-agent-keys",
      git,
      async () =>
        JSON.stringify({
          repo: "owner/repo",
          origin: "https://github.com/owner/repo.git",
          branch: "main",
          private_key: "/Users/example/.local/share/opencode-sandbox/keys/owner__repo",
        }),
      async () => undefined,
    );

    expect(policy).toEqual({
      repo: "owner/repo",
      origin: "github.com/owner/repo",
      branch: "main",
      allowedBranch: "main",
      head: "abc123",
      privateKeyPath: "/host-agent-keys/owner__repo",
    });
    expect(calls).toHaveLength(3);
  });

  test("buildFetchArgs includes prune and refspecs", () => {
    expect(buildFetchArgs(true, ["main", "refs/tags/v1"])).toEqual([
      "fetch",
      "--prune",
      "origin",
      "main",
      "refs/tags/v1",
    ]);
  });

  test("buildPushArgs supports force-with-lease", () => {
    expect(
      buildPushArgs(
        {
          repo: "owner/repo",
          origin: "github.com/owner/repo",
          branch: "main",
          allowedBranch: "main",
          head: "abc123",
          privateKeyPath: "/host-agent-keys/owner__repo",
        },
        "force-with-lease",
        "abc123",
      ),
    ).toEqual(["push", "--force-with-lease", "origin", "HEAD:refs/heads/main"]);
  });

  test("buildPushArgs rejects mismatched branches", () => {
    expect(() =>
      buildPushArgs(
        {
          repo: "owner/repo",
          origin: "github.com/owner/repo",
          branch: "feature",
          allowedBranch: "main",
          head: "abc123",
          privateKeyPath: "/host-agent-keys/owner__repo",
        },
        "none",
      ),
    ).toThrow("Current branch 'feature' does not match locked branch 'main'");
  });

  test("gitSshCommand pins the dedicated private key", () => {
    expect(gitSshCommand("/host-agent-keys/owner__repo")).toContain("-i /host-agent-keys/owner__repo");
  });
});

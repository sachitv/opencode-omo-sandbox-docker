import cors from "cors";
import express from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createPerplexityServer } from "@perplexity-ai/mcp-server/dist/server.js";
import { logger } from "@perplexity-ai/mcp-server/dist/logger.js";

const apiKey = process.env.PERPLEXITY_API_KEY;
if (!apiKey) {
  logger.error("PERPLEXITY_API_KEY environment variable is required");
  process.exit(1);
}

const app = express();
const port = Number.parseInt(process.env.PORT || "8080", 10);
const bindAddress = process.env.BIND_ADDRESS || "0.0.0.0";
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || ["*"];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    exposedHeaders: ["Mcp-Session-Id", "mcp-protocol-version"],
    allowedHeaders: ["Content-Type", "mcp-session-id"]
  })
);

app.use(express.json());

app.all("/mcp", async (req, res) => {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true
  });

  const mcpServer = createPerplexityServer();

  res.on("close", () => {
    transport.close();
  });

  try {
    await mcpServer.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    logger.error("Error handling MCP request", { error: String(error) });
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: { code: -32603, message: "Internal server error" },
        id: null
      });
    }
  } finally {
    await mcpServer.close().catch(() => {});
  }
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "perplexity-mcp-server" });
});

app.listen(port, bindAddress, () => {
  logger.info(`Perplexity MCP Server listening on http://${bindAddress}:${port}/mcp`);
  logger.info(`Allowed origins: ${allowedOrigins.join(", ")}`);
}).on("error", (error) => {
  logger.error("Server error", { error: String(error) });
  process.exit(1);
});

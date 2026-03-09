import http from "node:http";
import { Readable } from "node:stream";

const port = Number.parseInt(process.env.PORT ?? "4000", 10);
const apiKey = process.env.OPENROUTER_API_KEY;
const referer = process.env.OPENROUTER_HTTP_REFERER;
const title = process.env.OPENROUTER_X_TITLE;
const upstreamBase = new URL(
  process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1"
);

function resolveUpstreamUrl(requestUrl = "/") {
  const incoming = new URL(requestUrl, "http://proxy.internal");
  const normalizedPath =
    incoming.pathname === "/v1"
      ? "/"
      : incoming.pathname.startsWith("/v1/")
        ? incoming.pathname.slice(3)
        : incoming.pathname;
  const pathname = `${upstreamBase.pathname.replace(/\/$/, "")}${normalizedPath}`;
  return new URL(`${pathname}${incoming.search}`, upstreamBase);
}

const server = http.createServer(async (req, res) => {
  if (req.url === "/healthz") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  if (!apiKey) {
    res.writeHead(500, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: "OPENROUTER_API_KEY is not set" }));
    return;
  }

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value === undefined || key.toLowerCase() === "host") {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        headers.append(key, item);
      }
      continue;
    }

    headers.set(key, value);
  }

  headers.set("authorization", `Bearer ${apiKey}`);
  if (referer) {
    headers.set("http-referer", referer);
  }
  if (title) {
    headers.set("x-title", title);
  }

  try {
    const upstreamResponse = await fetch(resolveUpstreamUrl(req.url), {
      method: req.method,
      headers,
      body: req.method === "GET" || req.method === "HEAD" ? undefined : req,
      duplex: "half",
      redirect: "manual"
    });

    const responseHeaders = Object.fromEntries(upstreamResponse.headers.entries());
    delete responseHeaders["content-length"];

    res.writeHead(upstreamResponse.status, responseHeaders);

    if (upstreamResponse.body) {
      Readable.fromWeb(upstreamResponse.body).pipe(res);
      return;
    }

    res.end();
  } catch (error) {
    res.writeHead(502, { "content-type": "application/json" });
    res.end(
      JSON.stringify({
        error: "Failed to reach OpenRouter upstream",
        detail: error instanceof Error ? error.message : String(error)
      })
    );
  }
});

server.listen(port, "0.0.0.0", () => {
  console.log(`OpenRouter proxy listening on ${port}`);
});

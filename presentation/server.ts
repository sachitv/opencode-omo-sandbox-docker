const root = new URL("./", import.meta.url);
const port = Number(process.env.PORT || 3000);

function contentType(pathname: string): string {
  if (pathname.endsWith(".html")) return "text/html; charset=utf-8";
  if (pathname.endsWith(".css")) return "text/css; charset=utf-8";
  if (pathname.endsWith(".js") || pathname.endsWith(".mjs")) {
    return "text/javascript; charset=utf-8";
  }
  if (pathname.endsWith(".json")) return "application/json; charset=utf-8";
  if (pathname.endsWith(".svg")) return "image/svg+xml";
  if (pathname.endsWith(".png")) return "image/png";
  if (pathname.endsWith(".jpg") || pathname.endsWith(".jpeg")) return "image/jpeg";
  if (pathname.endsWith(".woff")) return "font/woff";
  if (pathname.endsWith(".woff2")) return "font/woff2";
  return "text/plain; charset=utf-8";
}

function safePath(pathname: string): string {
  const normalized = pathname === "/" ? "/index.html" : pathname;
  const decoded = decodeURIComponent(normalized).replace(/\/+/g, "/");

  if (decoded.split("/").includes("..")) {
    throw new Error("Invalid path");
  }

  return decoded;
}

const server = Bun.serve({
  port,
  development: true,
  async fetch(req) {
    const url = new URL(req.url);
    let pathname: string;

    try {
      pathname = safePath(url.pathname);
    } catch {
      return new Response("Bad request", { status: 400 });
    }

    const relativePath = pathname.startsWith("/") ? pathname.slice(1) : pathname;
    const file = Bun.file(new URL(relativePath, root));

    if (await file.exists()) {
      return new Response(file, {
        headers: {
          "Content-Type": contentType(pathname)
        }
      });
    }

    return new Response("Not found", { status: 404 });
  }
});

console.log(`Presentation server running at http://localhost:${server.port}`);

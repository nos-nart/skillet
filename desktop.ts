import { serveDir } from "https://deno.land/std@0.224.0/http/file_server.ts";

Deno.serve(async (req) => {
  const url = new URL(req.url);
  if (url.pathname.startsWith("/api/")) {
    return new Response(JSON.stringify({ status: "ok", app: "skillet" }), {
      headers: { "content-type": "application/json" },
    });
  }
  return serveDir(req, { fsRoot: "./dist", quiet: true });
});

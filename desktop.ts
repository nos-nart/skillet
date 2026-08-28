import { serveDir, serveFile } from "https://deno.land/std@0.224.0/http/file_server.ts";
import { handleApiRequest } from "./src/backend/api.ts";
import { join } from "https://deno.land/std@0.224.0/path/mod.ts";

const fsRoot = import.meta.dirname ? join(import.meta.dirname, "dist") : "./dist";

Deno.serve(async (req) => {
  const url = new URL(req.url);
  if (url.pathname.startsWith("/api/")) {
    return handleApiRequest(req);
  }

  const res = await serveDir(req, { fsRoot, quiet: true });
  if (res.status === 404) {
    // Single Page Application (SPA) fallback
    return serveFile(req, join(fsRoot, "index.html"));
  }
  return res;
});

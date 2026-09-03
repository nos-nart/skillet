import { serveDir, serveFile } from "https://deno.land/std@0.224.0/http/file_server.ts";
import { handleApiRequest } from "./src/backend/api.ts";
import { join } from "https://deno.land/std@0.224.0/path/mod.ts";

// In bundled mode import.meta.dirname resolves to the cache dir,
// not the project dir. CWD is the project root when launched via `deno task desktop`.
const fsRoot = join(Deno.cwd(), "dist");

Deno.serve(async (req) => {
  const url = new URL(req.url);
  if (url.pathname.startsWith("/api/")) {
    return handleApiRequest(req);
  }

  const res = await serveDir(req, { fsRoot, quiet: true });
  if (res.status === 404) {
    return serveFile(req, join(fsRoot, "index.html"));
  }
  return res;
});

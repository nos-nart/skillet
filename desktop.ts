import { serveDir } from "https://deno.land/std@0.224.0/http/file_server.ts";
import { handleApiRequest } from "./src/backend/api.ts";

Deno.serve(async (req) => {
  const url = new URL(req.url);
  if (url.pathname.startsWith("/api/")) {
    return handleApiRequest(req);
  }
  return serveDir(req, { fsRoot: "./dist", quiet: true });
});

// Tiny static server for the exported site (npm start). Serves ./out on $PORT.
// Useful for previewing, or if a Node host runs `npm start` after `npm run build`.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const root = join(process.cwd(), "out");
const port = Number(process.env.PORT) || 3000;
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "application/javascript", ".json": "application/json", ".png": "image/png", ".svg": "image/svg+xml", ".ico": "image/x-icon", ".woff2": "font/woff2", ".txt": "text/plain", ".xml": "application/xml", ".webmanifest": "application/manifest+json" };

async function file(p) {
  try {
    const s = await stat(p);
    return s.isDirectory() ? file(join(p, "index.html")) : p;
  } catch {
    return null;
  }
}

createServer(async (req, res) => {
  const url = decodeURIComponent((req.url || "/").split("?")[0]);
  const safe = normalize(url).replace(/^(\.\.[/\\])+/, "");
  const hit = (await file(join(root, safe))) || (await file(join(root, `${safe}.html`)));
  const path = hit || join(root, "404.html");
  res.writeHead(hit ? 200 : 404, { "content-type": types[extname(path)] || "application/octet-stream" });
  res.end(await readFile(path).catch(() => "Not found"));
}).listen(port, () => console.log(`WaqtPe website on http://localhost:${port}`));

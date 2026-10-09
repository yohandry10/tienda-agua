import { mkdir, writeFile } from "node:fs/promises";

// Vercel proxies the canonical Cloudflare Worker so both addresses share the
// exact React application, D1 database, and request validation.
await mkdir(".vercel-static", { recursive: true });
await writeFile(".vercel-static/deployment.txt", "VAIYO: https://aguavaiyo.com\n");
await mkdir(".vercel/output/static", { recursive: true });
await writeFile(".vercel/output/config.json", JSON.stringify({
  version: 3,
  routes: [{ src: "/(.*)", dest: "https://aguavaiyo.com/$1" }],
}, null, 2));
await writeFile(".vercel/output/static/deployment.txt", "VAIYO: https://aguavaiyo.com\n");

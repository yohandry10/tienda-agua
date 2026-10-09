// Sets the target without shell-specific environment syntax (Windows/Linux).
import { fileURLToPath } from "node:url";

process.env.VAIYO_DEPLOY_TARGET = "cloudflare";
process.argv = [process.execPath, fileURLToPath(new URL("./run-framework.mjs", import.meta.url)), "build"];
await import("./run-framework.mjs");

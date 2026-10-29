import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";
import vm from "node:vm";

const source = await readFile(new URL("../lib/meta-pixel.ts", import.meta.url), "utf8");
const storage = new Map();
globalThis.localStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) };
let scripts = [];
globalThis.document = { createElement: () => ({}), head: { appendChild: script => scripts.push(script) } };
globalThis.window = { location: { pathname: "/", search: "" } };
async function load(id) {
  const code = source.replace('import { META_PIXEL_ID } from "@/lib/meta-config";', `const META_PIXEL_ID = ${JSON.stringify(id)};`);
  const js = ts.transpileModule(code, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(js).toString("base64")}#${id || "empty"}`);
}
const disabled = await load("");
storage.set("vaiyo-meta-consent", "yes");
assert.equal(disabled.trackMeta("AddToCart", { value: 30, currency: "PEN" }), false);
assert.equal(scripts.length, 0, "no ID must not load Meta");

const pixel = await load("123456789012345");
storage.delete("vaiyo-meta-consent");
assert.equal(pixel.trackMeta("AddToCart", { value: 30, currency: "PEN" }), false);
assert.equal(scripts.length, 0, "tracking requires explicit consent");
storage.set("vaiyo-meta-consent", "no");
assert.equal(pixel.trackMeta("Lead", {}), false);
storage.set("vaiyo-meta-consent", "yes");
window.location = { pathname: "/pago", search: "?token=private" };
assert.equal(pixel.trackMeta("Purchase", {}), false);
assert.equal(scripts.length, 0, "payment tokens must never reach the pixel URL");
window.location.search = "";
pixel.trackConfirmedPurchase({ id: "test", total: 3000, mode: "TEST", state: "pagado" });
pixel.trackConfirmedPurchase({ id: "pending", total: 3000, mode: "PRODUCTION", state: "pendiente" });
assert.equal(scripts.length, 0, "test and pending payments must not record purchases");
pixel.trackConfirmedPurchase({ id: "order-1", total: 3000, mode: "PRODUCTION", state: "pagado" });
pixel.trackConfirmedPurchase({ id: "order-1", total: 3000, mode: "PRODUCTION", state: "pagado" });
assert.equal(scripts.length, 1);
const calls = window.fbq.queue;
const purchases = calls.filter(call => call[0] === "trackSingle" && call[2] === "Purchase");
assert.equal(purchases.length, 1, "repeated renders must not duplicate a purchase");
assert.deepEqual(purchases[0][3], { value: 30, currency: "PEN" });
storage.set("vaiyo-meta-consent", "no");
assert.equal(pixel.trackMeta("InitiateCheckout", {}), false, "revoked consent stops events");
const layout = await readFile(new URL("../app/layout.tsx", import.meta.url), "utf8");
const bootstrap = layout.match(/const paymentPrivacyBootstrap = "([^"\n]+)";/)?.[1];
assert.ok(bootstrap, "payment privacy bootstrap must exist");
const token = "a1234567-1234-1234-1234-123456789012";
let replaced;
vm.runInNewContext(bootstrap, {
  URL, location: { pathname: "/pago", href: `https://aguavaiyo.com/pago?token=${token}` },
  history: { state: { existing: true }, replaceState: (state, title, url) => { replaced = { state, url }; } }
});
assert.equal(replaced.url, "/pago");
assert.equal(replaced.state.vaiyoPaymentToken, token);
assert.equal(replaced.state.existing, true);
console.log("Meta Pixel: consentimiento, token, valor y deduplicación verificados.");

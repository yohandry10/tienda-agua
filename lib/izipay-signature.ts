export type PaymentFields = Record<string, string>;

function message(fields: PaymentFields, key: string) {
  return Object.keys(fields).filter(name => name.startsWith("vads_")).sort().map(name => fields[name]).join("+") + "+" + key;
}

export async function signPayment(fields: PaymentFields, secret: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signed = new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(message(fields, secret))));
  return btoa(String.fromCharCode(...signed));
}

export async function verifyPayment(fields: PaymentFields, secret: string) {
  if (!/^[A-Za-z0-9+/]{43}=$/.test(fields.signature ?? "")) return false;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
  const signature = Uint8Array.from(atob(fields.signature), char => char.charCodeAt(0));
  return crypto.subtle.verify("HMAC", key, signature, encoder.encode(message(fields, secret)));
}

export function paymentFields(body: string) {
  if (body.length > 32768) throw new Error("Invalid payment payload");
  const fields: PaymentFields = {};
  for (const [name, value] of new URLSearchParams(body)) {
    if (Object.hasOwn(fields, name)) throw new Error("Duplicate payment field");
    if (name.startsWith("vads_") || name === "signature") fields[name] = value;
  }
  return fields;
}

export function gatewayState(status: string) {
  if (status === "CAPTURED") return "pagado";
  if (status === "AUTHORISED") return "autorizado";
  if (["ABANDONED", "CANCELLED"].includes(status)) return "cancelado";
  if (["REFUSED", "EXPIRED", "CAPTURE_FAILED"].includes(status)) return "rechazado";
  return "pendiente";
}

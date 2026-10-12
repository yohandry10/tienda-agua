export type PaymentForm = { action: string; fields: Record<string, string>; token: string; mode: string; id: string; total: number };
export function openPayment(result: PaymentForm | { redirect: string }) {
  if ("redirect" in result) { window.location.assign(result.redirect); return; }
  if (result.action !== "https://secure.micuentaweb.pe/vads-payment/") throw new Error("Destino de pago no válido.");
  const form = document.createElement("form");
  form.method = "POST";
  form.action = result.action;
  form.hidden = true;
  for (const [name, value] of Object.entries(result.fields)) {
    const field = document.createElement("input");
    field.type = "hidden"; field.name = name; field.value = value;
    form.appendChild(field);
  }
  document.body.appendChild(form);
  form.submit();
}

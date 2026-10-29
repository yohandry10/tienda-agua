"use client";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, ShieldCheck, RefreshCw, MessageCircle, CircleAlert } from "lucide-react";
import { money, whatsapp } from "@/lib/catalog";
import { openPayment, type PaymentForm } from "@/lib/payment-browser";
import { META_CONSENT_EVENT, metaEnabled, trackConfirmedPurchase } from "@/lib/meta-pixel";

type Payment = { id: string; total: number; mode: string; state: string; items: { name: string; qty: number; price: number }[] };
export default function PaymentResult() {
  const [payment, setPayment] = useState<Payment | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [token, setToken] = useState("");
  const [polling, setPolling] = useState(true);
  useEffect(() => {
    let value = new URLSearchParams(window.location.search).get("token") ?? "";
    if (!value && !window.location.search && metaEnabled) { try { value = history.state?.vaiyoPaymentToken ?? ""; } catch {} }
    setToken(value);
    if (!/^[a-f0-9-]{36}$/.test(value)) { setError("No encontramos la referencia de tu pago. Si ya pagaste, consulta con nuestro equipo antes de intentarlo otra vez."); setPolling(false); return; }
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    let attempts = 0;
    async function load() {
      try {
        const response = await fetch("/api/payments/status?token=" + encodeURIComponent(value), { cache: "no-store" });
        const data = await response.json() as Payment & { error?: string };
        if (!response.ok) throw new Error(data.error ?? "No pudimos comprobar tu pago.");
        if (stopped) return;
        setPayment(data); setError("");
        if (data.state === "pendiente" && ++attempts < 20) timer = setTimeout(load, 1500);
        else setPolling(false);
      } catch (e) { if (!stopped) { setError(e instanceof Error ? e.message : "No pudimos comprobar tu pago."); setPolling(false); } }
    }
    void load();
    return () => { stopped = true; clearTimeout(timer); };
  }, []);
  const approved = payment && ["pagado", "autorizado"].includes(payment.state);
  const test = payment?.mode === "TEST";
  const failed = payment && ["rechazado", "cancelado"].includes(payment.state);
  useEffect(() => {
    if (!payment || payment.mode !== "PRODUCTION" || !["pagado", "autorizado"].includes(payment.state)) return;
    const track = () => trackConfirmedPurchase(payment);
    track();
    window.addEventListener(META_CONSENT_EVENT, track);
    return () => window.removeEventListener(META_CONSENT_EVENT, track);
  }, [payment]);
  async function retry() {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/payments/retry", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
      const result = await response.json() as (PaymentForm | { redirect: string }) & { error?: string };
      if (!response.ok) throw new Error(result.error ?? "No pudimos reabrir el pago.");
      openPayment(result);
    } catch (e) { setBusy(false); setError(e instanceof Error ? e.message : "No pudimos reabrir el pago."); }
  }
  return <main className="payment-page">
    <header className="payment-header"><a href="/" aria-label="VAIYO, inicio"><img src="/assets/vaiyo-logo.png" alt="VAIYO" width={112} height={84}/></a><a href="/"><ArrowLeft size={17}/> Volver a la tienda</a></header>
    <section className="payment-result" aria-live="polite">
      <span className={"payment-result__icon" + (failed || error ? " payment-result__icon--warning" : "")}>
        {approved ? <Check size={34}/> : failed || error ? <CircleAlert size={32}/> : <ShieldCheck size={32}/>}
      </span>
      <span className="eyebrow">TU PEDIDO VAIYO</span>
      <h1>{approved ? test ? "Prueba completada." : "Tu pedido está confirmado." : failed ? payment.state === "cancelado" ? "El pago se canceló." : "Revisemos tu pago." : error ? "Estamos para ayudarte." : polling ? "Confirmando tu pago." : "Tu pago está pendiente."}</h1>
      <p>{approved ? test ? "La conexión con Izipay funciona. Esta prueba no genera un cobro ni una entrega." : "Tu pago fue aprobado. Recibirás la confirmación por correo y nuestro equipo te contactará por WhatsApp para acordar la entrega." : failed ? "Tu pedido conserva su referencia. Puedes volver a intentar el pago o conversar con nuestro equipo." : polling ? "Estamos esperando la confirmación segura de Izipay. Esto puede tomar unos segundos." : "Todavía no recibimos una confirmación. Si ya pagaste, no repitas el pago; consulta con nuestro equipo."}</p>
      {payment && <div className="payment-summary"><div><span>Pedido</span><b>{payment.id}</b></div><div><span>Total</span><b>{money(payment.total)}</b></div></div>}
      {payment && payment.items?.length > 0 && <ul className="payment-items" aria-label="Productos de tu pedido">{payment.items.map((item, index) => <li key={index}><span><b>{item.name}</b><small>Cantidad: {item.qty}</small></span><strong>{money(item.price * item.qty)}</strong></li>)}</ul>}
      {test && <div className="payment-test-note"><ShieldCheck size={17}/> Modo de prueba · Sin cobros reales</div>}
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="payment-result__actions">
        {payment?.state === "pendiente" && !polling && <button className="button button-soft" onClick={()=>window.location.reload()}>Actualizar estado <RefreshCw size={18}/></button>}
        {failed && <button className="button button-primary" onClick={retry} disabled={busy}>{busy ? "Abriendo Izipay…" : "Reintentar pago"}<RefreshCw size={18}/></button>}
        {!test && payment && <a className={"button " + (approved ? "button-primary" : "button-soft")} href={whatsapp((approved ? "Hola VAIYO, mi pedido " + payment.id + " tiene el pago aprobado. Quisiera coordinar la entrega." : "Hola VAIYO, quisiera consultar el pago del pedido " + payment.id + ".") + "\n" + (payment.items ?? []).map(item => item.qty + " x " + item.name).join("\n") + "\nTotal: " + money(payment.total) + ".")} target="_blank" rel="noopener noreferrer">{approved ? "Coordinar mi entrega" : "Consultar mi pago"}<MessageCircle size={18}/></a>}
        <a href="/" className="text-action">Volver a VAIYO <ArrowLeft size={17}/></a>
      </div>
      <span className="payment-result__secure"><ShieldCheck size={15}/> Pago procesado por Izipay</span>
    </section>
  </main>;
}

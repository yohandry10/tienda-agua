"use client";
import { useEffect, useState } from "react";
import { META_CONSENT_EVENT, META_CONSENT_KEY, metaEnabled, startMetaPixel } from "@/lib/meta-pixel";

export default function MetaConsent() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!metaEnabled) return;
    let active = true;
    const showIfActive = () => { if (active) setVisible(true); };
    try {
      const choice = localStorage.getItem(META_CONSENT_KEY);
      if (choice === "yes") startMetaPixel();
      else if (choice !== "no") queueMicrotask(showIfActive);
    } catch { queueMicrotask(showIfActive); }
    const open = () => setVisible(true);
    window.addEventListener("vaiyo-open-cookie-settings", open);
    return () => { active = false; window.removeEventListener("vaiyo-open-cookie-settings", open); };
  }, []);
  if (!metaEnabled || !visible) return null;
  function choose(allow: boolean) {
    try { localStorage.setItem(META_CONSENT_KEY, allow ? "yes" : "no"); } catch { /* No tracking without stored consent. */ }
    setVisible(false);
    if (allow) startMetaPixel();
    window.dispatchEvent(new Event(META_CONSENT_EVENT));
    if (!allow && window.fbq) window.location.reload();
  }
  return <aside className="meta-consent" aria-label="Preferencias de publicidad">
    <p>Con tu permiso, usamos Meta Pixel para medir el rendimiento de nuestra publicidad. Puedes cambiar tu elección en cualquier momento. <a href="/privacidad">Más información</a>.</p>
    <div><button type="button" onClick={() => choose(false)}>Rechazar</button><button type="button" onClick={() => choose(true)}>Aceptar</button></div>
  </aside>;
}

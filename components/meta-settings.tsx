"use client";
import { metaEnabled } from "@/lib/meta-pixel";
export default function MetaSettings() {
  return metaEnabled ? <button type="button" onClick={() => window.dispatchEvent(new Event("vaiyo-open-cookie-settings"))}>Preferencias de publicidad</button> : null;
}

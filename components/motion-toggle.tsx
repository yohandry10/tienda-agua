"use client";

import { useEffect, useState } from "react";
import { CirclePause, CirclePlay } from "lucide-react";
import { motionEnabled, MOTION_CHANGE_EVENT, MOTION_STORAGE_KEY } from "@/lib/motion";

export default function MotionToggle() {
  const [enabled, setEnabled] = useState(true);
  useEffect(() => {
    const sync = () => setEnabled(motionEnabled());
    sync();
    window.addEventListener(MOTION_CHANGE_EVENT, sync);
    return () => window.removeEventListener(MOTION_CHANGE_EVENT, sync);
  }, []);

  const toggle = () => {
    const preference = enabled ? "off" : "on";
    document.documentElement.dataset.vaiyoMotion = preference;
    try { localStorage.setItem(MOTION_STORAGE_KEY, preference); } catch { /* Motion remains controllable without storage. */ }
    window.dispatchEvent(new Event(MOTION_CHANGE_EVENT));
  };

  return <button className="motion-toggle" onClick={toggle} aria-pressed={!enabled}>
    {enabled ? <CirclePause size={15}/> : <CirclePlay size={15}/>}
    {enabled ? "Reducir movimiento" : "Activar animaciones"}
  </button>;
}

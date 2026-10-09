"use client";

import { useEffect } from "react";
import { motionEnabled, MOTION_CHANGE_EVENT } from "@/lib/motion";

export default function useHeroMotion() {
  useEffect(() => {
    const hero = document.querySelector<HTMLElement>(".hero");
    if (!hero) return;
    let frame = 0;
    let previousTime = 0;
    let position = 0;
    let destination = 0;

    const paint = () => hero.style.setProperty("--hero-flight", position.toFixed(4));
    const step = (time: number) => {
      const elapsed = previousTime ? Math.min(time - previousTime, 64) : 16;
      previousTime = time;
      // Use elapsed time so the glide has the same pace on 60 Hz and 120 Hz screens.
      position += (destination - position) * (1 - Math.exp(-elapsed / 85));
      if (Math.abs(destination - position) < .0005) {
        position = destination;
        frame = 0;
        previousTime = 0;
      } else {
        frame = requestAnimationFrame(step);
      }
      paint();
    };
    const update = () => {
      const bounds = hero.getBoundingClientRect();
      destination = Math.max(0, Math.min(1, -bounds.top / (bounds.height * .8)));
      if (!motionEnabled() || document.hidden || bounds.bottom <= 0) {
        cancelAnimationFrame(frame);
        frame = 0;
        previousTime = 0;
        position = motionEnabled() ? destination : 0;
        paint();
        return;
      }
      if (!frame) frame = requestAnimationFrame(step);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    document.addEventListener("visibilitychange", update);
    window.addEventListener(MOTION_CHANGE_EVENT, update);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      document.removeEventListener("visibilitychange", update);
      window.removeEventListener(MOTION_CHANGE_EVENT, update);
      hero.style.removeProperty("--hero-flight");
    };
  }, []);
}

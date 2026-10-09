"use client";

import { useEffect } from "react";
import { motionEnabled, MOTION_CHANGE_EVENT } from "@/lib/motion";

export default function useScrollReveal() {
  useEffect(() => {
    const root = document.documentElement;
    const targets = [...document.querySelectorAll<HTMLElement>(".reveal")];
    let observer: IntersectionObserver | undefined;

    const setup = () => {
      observer?.disconnect();
      if (!motionEnabled()) {
        root.classList.remove("motion-ready");
        return;
      }
      root.classList.add("motion-ready");
      observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer?.unobserve(entry.target);
        });
      }, { threshold: 0, rootMargin: "0px 0px -8% 0px" });
      targets.filter(target => !target.classList.contains("is-visible")).forEach(target => observer?.observe(target));
    };

    setup();
    window.addEventListener(MOTION_CHANGE_EVENT, setup);
    return () => {
      observer?.disconnect();
      window.removeEventListener(MOTION_CHANGE_EVENT, setup);
      root.classList.remove("motion-ready");
    };
  }, []);
}

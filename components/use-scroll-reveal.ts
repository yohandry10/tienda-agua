"use client";

import { useEffect } from "react";

export default function useScrollReveal() {
  useEffect(() => {
    const root = document.documentElement;
    const targets = [...document.querySelectorAll<HTMLElement>(".reveal")];
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let observer: IntersectionObserver | undefined;

    const setup = () => {
      observer?.disconnect();
      if (reducedMotion.matches) {
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
    reducedMotion.addEventListener("change", setup);
    return () => {
      observer?.disconnect();
      reducedMotion.removeEventListener("change", setup);
      root.classList.remove("motion-ready");
    };
  }, []);
}

"use client";

import { useEffect } from "react";

// One IntersectionObserver for the whole landing page. Each [data-reveal]
// section fades and rises once at 20% visible, then stops being watched — no
// scroll listener, no state in the callback, nothing for the compiler to chase.
// The start state lives in globals.css behind `scripting: enabled`, so a page
// with no JS renders every section as-is.
export function Reveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-revealed");
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.2 },
    );

    document
      .querySelectorAll("[data-reveal]")
      .forEach((target) => observer.observe(target));

    return () => observer.disconnect();
  }, []);

  return null;
}

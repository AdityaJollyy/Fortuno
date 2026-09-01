"use client";

import { useEffect, useRef, useState } from "react";

import { formatCurrencyWhole } from "@/lib/format";

// --animate-duration-page. A rAF loop cannot read a CSS token, so this is the
// one place the number is written out; keep the two in step.
const DURATION = 400;

// Counts a headline figure up from zero, once, on mount. Renders through
// formatCurrencyWhole, so the parent supplies the type and `tabular-nums` —
// the digits must not reflow while they change.
export function CountUp({ value }) {
  // Server and no-JS render the real figure, never a zero.
  const [shown, setShown] = useState(value);
  const animated = useRef(false);

  useEffect(() => {
    // A later value (the budget was edited) lands instantly — mount, once.
    if (animated.current) {
      setShown(value);
      return;
    }
    animated.current = true;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame;
    let start;

    const step = (now) => {
      start ??= now;
      const t = Math.min((now - start) / DURATION, 1);
      // ease-out cubic — ends flat, never overshoots 1.
      setShown(value * (1 - (1 - t) ** 3));
      if (t < 1) frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return formatCurrencyWhole(shown);
}

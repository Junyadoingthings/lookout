"use client";

import { animate, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";

/**
 * Animated integer counter. Writes to the DOM node directly so there is no
 * per-frame React state. Server-renders the final value, so it reads correctly
 * without JS and respects prefers-reduced-motion.
 */
export function Counter({ value, className }: { value: number; className?: string }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (reduce) {
      node.textContent = value.toLocaleString();
      return;
    }
    const controls = animate(0, value, {
      duration: 0.5,
      ease: "easeOut",
      onUpdate: (v) => {
        node.textContent = Math.round(v).toLocaleString();
      },
    });
    return () => controls.stop();
  }, [value, reduce]);

  return (
    <span ref={ref} className={className} aria-label={String(value)}>
      {value.toLocaleString()}
    </span>
  );
}

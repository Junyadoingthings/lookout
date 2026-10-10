"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Resizable two-pane split for the alert detail. A draggable divider sets the
 * left pane width (clamped 32-72%). Stacks vertically below lg. Keyboard
 * accessible via the separator role with arrow keys.
 */
export function DetailSplit({ left, right }: { left: ReactNode; right: ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [leftPct, setLeftPct] = useState(52);
  const dragging = useRef(false);

  const clamp = (v: number) => Math.min(72, Math.max(32, v));

  const onMove = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setLeftPct(clamp(((clientX - rect.left) / rect.width) * 100));
  }, []);

  const startDrag = (e: React.PointerEvent) => {
    dragging.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const move = (ev: PointerEvent) => dragging.current && onMove(ev.clientX);
    const up = () => {
      dragging.current = false;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  return (
    <>
      <div className="flex flex-col gap-4 lg:hidden">
        <div>{left}</div>
        <div>{right}</div>
      </div>

      <div ref={containerRef} className="hidden min-h-[60vh] lg:flex">
        <div style={{ width: `${leftPct}%` }} className="min-w-0 pr-3">
          {left}
        </div>
        <div
          role="separator"
          aria-orientation="vertical"
          aria-valuenow={Math.round(leftPct)}
          tabIndex={0}
          onPointerDown={startDrag}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") setLeftPct((v) => clamp(v - 2));
            if (e.key === "ArrowRight") setLeftPct((v) => clamp(v + 2));
          }}
          className={cn(
            "group relative mx-0.5 w-1 shrink-0 cursor-col-resize rounded bg-border transition-colors hover:bg-accent focus-visible:bg-accent",
          )}
          title="Drag to resize"
        >
          <span className="absolute inset-y-0 -right-1.5 -left-1.5" />
        </div>
        <div style={{ width: `${100 - leftPct}%` }} className="min-w-0 pl-3">
          {right}
        </div>
      </div>
    </>
  );
}

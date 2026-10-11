"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";

interface Step {
  selector: string;
  title: string;
  body: string;
}

const STEPS: Step[] = [
  {
    selector: "[data-tour=nav]",
    title: "The console",
    body: "Alerts is the live queue. Coverage, Detections and Lab show how the detections were built and what they catch.",
  },
  {
    selector: "[data-tour=search]",
    title: "Jump anywhere",
    body: "Press Cmd+K any time to search and move between sections. Press ? to see every shortcut.",
  },
  {
    selector: "[data-tour=queue]",
    title: "Triage from the keyboard",
    body: "New detections land here. Use j and k to move, enter to open, and t / f / e to set a verdict. Every alert comes from the real lab.",
  },
  {
    selector: "[data-tour=filters]",
    title: "Filter and share",
    body: "Filter by severity, status or search. The filters live in the URL, so a view can be shared by copying the link.",
  },
];

const KEY = "lookout_tour_done_v1";

export function Tour() {
  const [active, setActive] = useState(false);
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      try {
        if (!localStorage.getItem(KEY)) setActive(true);
      } catch {
        /* ignore */
      }
    });
    const onStart = () => {
      setI(0);
      setActive(true);
    };
    window.addEventListener("lookout:tour", onStart);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("lookout:tour", onStart);
    };
  }, []);

  const measure = useCallback(() => {
    const step = STEPS[i];
    if (!step) return;
    const el = document.querySelector(step.selector);
    if (el) {
      el.scrollIntoView({ block: "nearest", behavior: "smooth" });
      setRect(el.getBoundingClientRect());
    } else {
      setRect(null);
    }
  }, [i]);

  useLayoutEffect(() => {
    if (!active) return;
    const raf = requestAnimationFrame(measure);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [active, measure]);

  const finish = () => {
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      /* ignore */
    }
    setActive(false);
  };

  if (!active) return null;
  const step = STEPS[i];
  if (!step) return null;

  const pad = 6;
  const box = rect
    ? {
        top: rect.top - pad,
        left: rect.left - pad,
        width: rect.width + pad * 2,
        height: rect.height + pad * 2,
      }
    : null;

  // Place the tooltip below the highlight, or centered if no target.
  const tipTop = box
    ? Math.min(box.top + box.height + 10, window.innerHeight - 180)
    : window.innerHeight / 2 - 90;
  const tipLeft = box
    ? Math.max(12, Math.min(box.left, window.innerWidth - 332))
    : window.innerWidth / 2 - 160;

  return (
    <div className="fixed inset-0 z-50">
      {/* Dim with a spotlight hole via box-shadow. */}
      {box ? (
        <div
          className="pointer-events-none absolute rounded-lg transition-all duration-200"
          style={{
            top: box.top,
            left: box.left,
            width: box.width,
            height: box.height,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.6)",
            outline: "2px solid var(--accent)",
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-black/60" />
      )}

      <div
        className="absolute w-80 rounded-lg border border-border bg-surface p-4 shadow-2xl"
        style={{ top: tipTop, left: tipLeft }}
      >
        <div className="text-xs text-muted-2">
          Step {i + 1} of {STEPS.length}
        </div>
        <h3 className="mt-1 text-sm font-semibold text-foreground">{step.title}</h3>
        <p className="mt-1 text-sm text-muted">{step.body}</p>
        <div className="mt-3 flex items-center justify-between">
          <button
            type="button"
            onClick={finish}
            className="text-xs text-muted-2 hover:text-foreground"
          >
            Skip
          </button>
          <div className="flex gap-2">
            {i > 0 && (
              <button
                type="button"
                onClick={() => setI((n) => n - 1)}
                className="rounded-md border border-border px-2.5 py-1 text-xs text-muted hover:text-foreground"
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={() => (i === STEPS.length - 1 ? finish() : setI((n) => n + 1))}
              className="rounded-md bg-accent px-2.5 py-1 text-xs font-medium text-accent-fg hover:opacity-90"
            >
              {i === STEPS.length - 1 ? "Done" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

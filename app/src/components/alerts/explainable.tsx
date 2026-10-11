"use client";

import { HelpCircle, Sparkles, X } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { explainFieldAction } from "@/app/alerts/ai-actions";

/**
 * Wraps a log field value with an "explain" affordance (analyst mode). Clicking
 * asks the model for a beginner-friendly explanation of the field and shows it
 * inline. The value is sent as untrusted data; the model only explains it.
 */
export function Explainable({
  field,
  value,
  ruleContext,
  aiReady,
  children,
}: {
  field: string;
  value: string;
  ruleContext: string;
  aiReady: boolean;
  children: React.ReactNode;
}) {
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState<{ explanation: string; whyItMatters?: string } | null>(null);

  if (!aiReady) return <>{children}</>;

  const explain = () =>
    start(async () => {
      setOpen(true);
      if (text) return;
      const res = await explainFieldAction(field, value, ruleContext);
      if (res.ok) setText({ explanation: res.explanation, whyItMatters: res.whyItMatters });
      else {
        toast.error(res.error);
        setOpen(false);
      }
    });

  return (
    <span className="inline-flex flex-col gap-1">
      <span className="inline-flex items-center gap-1.5">
        {children}
        <button
          type="button"
          onClick={explain}
          disabled={pending}
          className="text-muted-2 transition-colors hover:text-accent disabled:opacity-50"
          aria-label={`Explain ${field}`}
          title="Explain this field (AI)"
        >
          <HelpCircle size={13} />
        </button>
      </span>
      {open && (
        <span className="mt-1 block rounded-md border border-border bg-surface-2 p-2 text-xs text-muted">
          <span className="mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1 font-medium text-accent">
              <Sparkles size={11} /> AI explanation
            </span>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close">
              <X size={12} className="text-muted-2 hover:text-foreground" />
            </button>
          </span>
          {pending && !text ? (
            <span className="text-muted-2">Explaining…</span>
          ) : text ? (
            <>
              <span className="block text-foreground">{text.explanation}</span>
              {text.whyItMatters && (
                <span className="mt-1 block text-muted">{text.whyItMatters}</span>
              )}
            </>
          ) : null}
        </span>
      )}
    </span>
  );
}

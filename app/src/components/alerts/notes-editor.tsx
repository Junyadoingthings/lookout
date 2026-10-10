"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { saveAlertNotes } from "@/app/alerts/actions";

export function NotesEditor({ id, initial }: { id: string; initial: string | null }) {
  const [value, setValue] = useState(initial ?? "");
  const [pending, start] = useTransition();
  const dirty = value !== (initial ?? "");

  return (
    <div className="space-y-2">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="What did you check? What's the verdict reasoning? Next steps."
        rows={5}
        className="w-full resize-y rounded-md border border-border bg-surface-2 px-3 py-2 text-sm text-foreground placeholder:text-muted-2 focus:border-accent focus-visible:outline-none"
      />
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={!dirty || pending}
          onClick={() =>
            start(async () => {
              try {
                await saveAlertNotes(id, value);
                toast.success("Notes saved");
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Could not save");
              }
            })
          }
          className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-accent-fg transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Saving" : "Save notes"}
        </button>
        {dirty && <span className="text-xs text-muted-2">Unsaved changes</span>}
      </div>
    </div>
  );
}

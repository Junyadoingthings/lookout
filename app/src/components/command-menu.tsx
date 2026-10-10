"use client";

import { Command } from "cmdk";
import { Moon, Search, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { NAV_ITEMS } from "@/lib/ui/meta";

export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    function onOpen() {
      setOpen(true);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("vantage:command", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("vantage:command", onOpen);
    };
  }, []);

  const run = useCallback((fn: () => void) => {
    setOpen(false);
    fn();
  }, []);

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Command menu"
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-[18vh] backdrop-blur-sm data-[state=closed]:hidden"
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div className="w-full max-w-lg overflow-hidden rounded-xl border border-border bg-surface shadow-2xl">
        <div className="flex items-center gap-2 border-b border-border px-3">
          <Search size={15} className="text-muted-2" />
          <Command.Input
            placeholder="Go to, or run a command"
            className="h-11 w-full bg-transparent text-sm text-foreground placeholder:text-muted-2 focus:outline-none"
          />
        </div>
        <Command.List className="max-h-80 overflow-y-auto p-2">
          <Command.Empty className="px-2 py-6 text-center text-sm text-muted">
            No results.
          </Command.Empty>
          <Command.Group heading="Go to" className="px-1 text-xs text-muted-2 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5">
            {NAV_ITEMS.map((item) => (
              <Command.Item
                key={item.href}
                onSelect={() => run(() => router.push(item.href))}
                className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-sm text-foreground data-[selected=true]:bg-surface-hover"
              >
                <item.icon size={15} className="text-muted-2" />
                {item.label}
              </Command.Item>
            ))}
          </Command.Group>
          <Command.Group heading="Actions" className="px-1 text-xs text-muted-2 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5">
            <Command.Item
              onSelect={() => run(() => setTheme(resolvedTheme === "dark" ? "light" : "dark"))}
              className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-sm text-foreground data-[selected=true]:bg-surface-hover"
            >
              {resolvedTheme === "dark" ? <Sun size={15} className="text-muted-2" /> : <Moon size={15} className="text-muted-2" />}
              Toggle theme
            </Command.Item>
          </Command.Group>
        </Command.List>
        <div className="flex items-center justify-between border-t border-border px-3 py-1.5 text-[11px] text-muted-2">
          <span>Navigate with arrows</span>
          <span>
            <kbd className="font-mono">enter</kbd> to select · <kbd className="font-mono">esc</kbd> to close
          </span>
        </div>
      </div>
    </Command.Dialog>
  );
}

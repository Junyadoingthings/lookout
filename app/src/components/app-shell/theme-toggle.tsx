"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { cn } from "@/lib/utils";

/**
 * Theme toggle. Both icons are rendered and swapped with the `dark:` variant
 * (class strategy), so there is no mounted-state flash or hydration mismatch.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-hover hover:text-foreground",
        className,
      )}
      aria-label="Toggle theme"
      title="Toggle theme"
    >
      <Moon size={16} className="hidden dark:block" />
      <Sun size={16} className="block dark:hidden" />
    </button>
  );
}

"use client";

import { Code2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Logo } from "@/components/brand/logo";
import { NAV_ITEMS } from "@/lib/ui/meta";
import { cn } from "@/lib/utils";

import { ThemeToggle } from "./theme-toggle";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col border-r border-border bg-surface md:flex">
      <div className="flex h-14 items-center px-4">
        <Link href="/alerts" className="rounded-md focus-visible:outline-none">
          <Logo />
        </Link>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-2">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors",
                active
                  ? "bg-accent-muted font-medium text-foreground"
                  : "text-muted hover:bg-surface-hover hover:text-foreground",
              )}
            >
              <Icon
                size={16}
                strokeWidth={2}
                className={active ? "text-accent" : "text-muted-2 group-hover:text-foreground"}
              />
              <span className="flex-1">{item.label}</span>
              {item.shortcut && (
                <kbd className="font-mono text-[10px] text-muted-2 opacity-0 transition-opacity group-hover:opacity-100">
                  {item.shortcut}
                </kbd>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <a
          href="https://github.com/Junyadoingthings/vantage"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
        >
          <Code2 size={16} strokeWidth={2} className="text-muted-2" />
          <span className="flex-1">Source</span>
        </a>
        <div className="mt-1 flex items-center justify-between px-2.5">
          <span className="text-[11px] text-muted-2">Theme</span>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}

/** Horizontal nav for narrow screens. */
export function MobileNav() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-1 border-b border-border bg-surface/95 px-3 backdrop-blur md:hidden">
      <Link href="/alerts" className="mr-1">
        <Logo collapsed />
      </Link>
      <nav className="flex flex-1 items-center gap-0.5 overflow-x-auto">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              title={item.label}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs transition-colors",
                active ? "bg-accent-muted text-foreground" : "text-muted hover:text-foreground",
              )}
            >
              <Icon size={15} className={active ? "text-accent" : ""} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <ThemeToggle />
    </header>
  );
}

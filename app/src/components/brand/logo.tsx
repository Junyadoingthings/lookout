import { cn } from "@/lib/utils";

/**
 * Lookout mark: a watchtower sightline. Two strokes converge to a focal point
 * (the lookout point) over a shield base. Uses currentColor so it inherits the
 * surrounding text/accent colour.
 */
export function LogoMark({ className, size = 24 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M4 5.5 C4 4.7 4.7 4 5.5 4 H26.5 C27.3 4 28 4.7 28 5.5 V16 C28 23 22.8 27 16 29 C9.2 27 4 23 4 16 Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        opacity="0.35"
      />
      <path
        d="M10 11 L16 21 L22 11"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="13.5" r="2" fill="currentColor" />
    </svg>
  );
}

export function Logo({
  className,
  collapsed = false,
}: {
  className?: string;
  collapsed?: boolean;
}) {
  return (
    <span className={cn("flex items-center gap-2 font-semibold tracking-tight", className)}>
      <span className="text-accent">
        <LogoMark size={22} />
      </span>
      {!collapsed && <span className="text-[15px] text-foreground">Lookout</span>}
    </span>
  );
}

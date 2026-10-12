import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";

import { MobileNav, Sidebar } from "@/components/app-shell/sidebar";
import { Copilot } from "@/components/assistant/copilot";
import { CommandMenu } from "@/components/command-menu";
import { ShortcutsOverlay } from "@/components/shortcuts-overlay";
import { ThemeProvider } from "@/components/theme-provider";

import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Lookout", template: "%s · Lookout" },
  description: "Home SOC lab and alert triage console. Real detections, human verdicts.",
  openGraph: {
    title: "Lookout",
    description: "Home SOC lab and alert triage console.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
    >
      <body className="min-h-full">
        {/* Boot splash: pure-CSS so it paints on first load with no JS wait.
            It draws the mark, sweeps the bar, then fades out on its own via a
            forwards animation and ends non-interactive. No JS, no hydration. */}
        <div id="app-loader" aria-hidden="true">
          <div className="li-mark">
            <span className="li-glow" />
            <svg viewBox="0 0 32 32" fill="none">
              <circle className="li-ping li-ping1" cx="16" cy="16" r="6" />
              <circle className="li-ping li-ping2" cx="16" cy="16" r="6" />
              <path
                className="li-shield"
                pathLength={1}
                d="M4 5.5 C4 4.7 4.7 4 5.5 4 H26.5 C27.3 4 28 4.7 28 5.5 V16 C28 23 22.8 27 16 29 C9.2 27 4 23 4 16 Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
                opacity="0.4"
              />
              <path
                className="li-chev"
                pathLength={1}
                d="M10 11 L16 21 L22 11"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle className="li-dot" cx="16" cy="13.5" r="2" fill="currentColor" />
            </svg>
          </div>
          <div className="li-word" aria-label="Lookout">
            {"Lookout".split("").map((c, i) => (
              <span key={i} style={{ animationDelay: `${0.55 + i * 0.05}s` }}>
                {c}
              </span>
            ))}
          </div>
          <div className="li-sub">Security Operations</div>
          <div className="li-bar" />
        </div>
        <ThemeProvider>
          <div className="flex min-h-dvh">
            <Sidebar />
            <div className="flex min-w-0 flex-1 flex-col">
              <MobileNav />
              <main className="min-w-0 flex-1">{children}</main>
            </div>
          </div>
          <CommandMenu />
          <ShortcutsOverlay />
          <Copilot />
          <Toaster
            theme="system"
            position="bottom-right"
            toastOptions={{
              style: {
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                color: "var(--foreground)",
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}

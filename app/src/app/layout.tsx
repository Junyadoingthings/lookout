import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";

import { MobileNav, Sidebar } from "@/components/app-shell/sidebar";
import { CommandMenu } from "@/components/command-menu";
import { ShortcutsOverlay } from "@/components/shortcuts-overlay";
import { ThemeProvider } from "@/components/theme-provider";

import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "VANTAGE", template: "%s · VANTAGE" },
  description: "Home SOC lab and alert triage console. Real detections, human verdicts.",
  openGraph: {
    title: "VANTAGE",
    description: "Home SOC lab and alert triage console.",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
    >
      <body className="min-h-full">
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

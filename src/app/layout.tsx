import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Tollgate — The Release Gate for AI Agent Security",
  description: "Break, patch, price, and ship or revert. Automated security gates measuring the toll on honest work.",
};

export const viewport: Viewport = {
  themeColor: "#fbfbfd",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* SF Pro renders natively on Apple devices; Inter (with its optical-size axis) stands in everywhere else. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400..700&display=swap"
        />
      </head>
      <body className="min-h-screen bg-apple-bg text-apple-text antialiased">
        <Navbar />
        <main>{children}</main>
        <footer className="mt-32 border-t border-black/[0.06]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row md:items-center justify-between gap-4 text-[12px] text-apple-muted">
            <p>Tollgate &copy; 2026 &middot; School of Cyber Defense / GISEC 2026</p>
            <p className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <code className="font-mono text-[11.5px] text-apple-text bg-apple-subtle border border-black/[0.06] rounded-md px-2 py-0.5">
                tollgate demo --mock
              </code>
              <span>100 Offline Tests Passing</span>
              <span>Zero Hallucinated Metrics</span>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}

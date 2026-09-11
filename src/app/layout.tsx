import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Tollgate — The Release Gate for AI Agent Security",
  description: "Break, patch, price, and ship or revert. Automated security gates measuring the toll on honest work.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-cyber-bg text-cyber-text antialiased selection:bg-cyber-accent selection:text-cyber-bg">
        <Navbar />
        <main>{children}</main>
        <footer className="border-t border-cyber-border py-8 mt-20 bg-cyber-surface/50 text-center font-mono text-xs text-cyber-muted">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p>
              Tollgate &copy; 2026 &middot; School of Cyber Defense / GISEC 2026
            </p>
            <p className="text-cyber-dim">
              <code>tollgate demo --mock</code> &middot; 100 Offline Tests Passing &middot; Zero Hallucinated Metrics
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}

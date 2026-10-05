import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: { default: "The Global Feed", template: "%s · The Global Feed" },
  description: "Global communications platform — draft, translate and publish releases.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-surface text-text-primary antialiased">
        {children}
        <Toaster theme="dark" position="bottom-right"
          toastOptions={{ style: { background: "#1d2433", border: "1px solid #2a3347", color: "#f1f5f9" } }}
        />
      </body>
    </html>
  );
}

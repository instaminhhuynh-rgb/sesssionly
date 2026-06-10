import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sessionly · Client Operations Layer",
  description: "Everything that happens before, during, and after an appointment.",
  appleWebApp: {
    capable: true,
    title: "Sessionly",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#1C1C1E",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans text-ink">{children}</body>
    </html>
  );
}

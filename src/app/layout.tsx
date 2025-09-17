import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Maratika Thuchi",
  description: "Admin tooling for statement ingestion and reporting",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

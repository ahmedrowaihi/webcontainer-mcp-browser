import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MCP Browser",
  description: "MCP Browser",
  generator: "MCP Browser",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

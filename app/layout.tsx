import { LLMBubble } from "@/lib/webcontainer-mcp/llm";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WebContainer MCP Browser",
  description: "WebContainer MCP Browser",
  generator: "WebContainer MCP Browser",
  authors: [{ name: "Ahmed Rowaihi", url: "https://github.com/ahmedrowaihi" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="h-svh">
        {children}
        <LLMBubble />
      </body>
    </html>
  );
}

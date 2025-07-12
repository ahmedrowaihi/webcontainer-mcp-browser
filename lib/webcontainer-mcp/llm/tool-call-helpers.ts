import type { ParsedToolCall } from "./types";

export function parseToolCalls(text: string): ParsedToolCall[] {
  const regex = /<tool_call>\s*(\{[\s\S]*?\})\s*<\/tool_call>/g;
  const calls: ParsedToolCall[] = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    try {
      const parsed = JSON.parse(match[1]);
      if (parsed.name && parsed.arguments !== undefined) {
        calls.push({ name: parsed.name, arguments: parsed.arguments });
      }
    } catch {}
  }
  return calls;
}

export function removeToolCallsFromText(text: string): string {
  return text.replace(/<tool_call>[\s\S]*?<\/tool_call>/g, "").trim();
} 
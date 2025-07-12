import { parseToolCalls, removeToolCallsFromText } from "../tool-call-helpers";
import type { Message } from "../types";

export async function handleLLMResponse(
  input: string,
  chat: (
    systemPrompt: string,
    tools: any[],
    history: any[],
    input: string
  ) => Promise<any>,
  setMessages: (fn: (msgs: Message[]) => Message[]) => void,
  handleCallTool: (name: string, args: any) => Promise<any>,
  systemPrompt: string,
  tools: any[],
  history: Message[]
) {
  const response = await chat(systemPrompt, tools, history, input);
  const message = response.choices[0]?.message;
  if (!message?.content) {
    setMessages((msgs) => [...msgs, { role: "assistant", text: "I'm sorry, I didn't understand that." }]);
    return;
  }
  const fullText = message.content;
  const toolCalls = parseToolCalls(fullText);
  const responseText = removeToolCallsFromText(fullText);
  if (responseText) setMessages((msgs) => [...msgs, { role: "assistant", text: responseText }]);
  if (toolCalls.length > 0) {
    for (const call of toolCalls) {
      try {
        const result = await handleCallTool(call.name, call.arguments);
        setMessages((msgs) => [
          ...msgs,
          { role: "assistant", text: `🔧 Called ${call.name} with ${JSON.stringify(call.arguments)}` },
          { role: "tool", text: `${call.name}: ${typeof result === "string" ? result : JSON.stringify(result)}` },
        ]);
      } catch (error) {
        setMessages((msgs) => [...msgs, { role: "assistant", text: `❌ Error calling ${call.name}: ${String(error)}` }]);
      }
    }
  }
} 
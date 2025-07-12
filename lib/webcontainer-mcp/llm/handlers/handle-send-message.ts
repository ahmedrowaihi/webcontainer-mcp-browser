import type { Message } from "../types";
import { handleLLMResponse } from "./handle-llm-response";

export async function handleSendMessage(
  input: string,
  setMessages: (fn: (msgs: Message[]) => Message[]) => void,
  setLoading: (loading: boolean) => void,
  chat: (
    systemPrompt: string,
    tools: any[],
    history: any[],
    input: string
  ) => Promise<any>,
  handleCallTool: (name: string, args: any) => Promise<any>,
  systemPrompt: string,
  tools: any[],
  history: Message[]
) {
  setMessages((msgs) => [...msgs, { role: "user", text: input }]);
  setLoading(true);
  try {
    await handleLLMResponse(input, chat, setMessages, handleCallTool, systemPrompt, tools, history);
  } catch (err) {
    setMessages((msgs) => [
      ...msgs,
      { role: "assistant", text: "Error: " + (err instanceof Error ? err.message : String(err)) },
    ]);
  }
  setLoading(false);
} 
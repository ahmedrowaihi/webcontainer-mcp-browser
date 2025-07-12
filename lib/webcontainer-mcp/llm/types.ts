export interface ParsedToolCall {
  name: string;
  arguments: any;
}

export interface Message {
  role: "user" | "assistant" | "tool";
  text: string;
}

export type LLMProgress = {
  progress: number; // 0-100
  status: string;
}; 
import { useRef, useState, useCallback } from "react";
import { CreateMLCEngine, MLCEngine } from "@mlc-ai/web-llm";
import type { ChatCompletionMessageParam } from "@mlc-ai/web-llm/lib/openai_api_protocols/chat_completion";
import type { LLMProgress } from "./types";

export function useLLMEngine() {
  const engineRef = useRef<MLCEngine | null>(null);
  const [progress, setProgress] = useState<LLMProgress>({ progress: 0, status: "Idle" });
  async function ensureEngine() {
    if (!engineRef.current) {
      setProgress({ progress: 0, status: "🔄 0%" });
      engineRef.current = await CreateMLCEngine(
        "Llama-3.1-8B-Instruct-q4f32_1-MLC",
        {
          initProgressCallback: (p: { progress: number }) =>
            setProgress({ progress: Math.round(p.progress * 100), status: `🔄 ${Math.round(p.progress * 100)}%` }),
        }
      );
      setProgress({ progress: 100, status: "🚀 100%" });
    }
    return engineRef.current;
  }
  const createCompletion = useCallback(async (systemPrompt: string, _tools: any[], history: any[], input: string) => {
    const engine = await ensureEngine();
    const historyWindow = 10;
    const recentMessages = history.slice(-historyWindow);
    const llmMessages: ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...recentMessages.filter((m) => m.role === "user" || m.role === "assistant").map((m) => ({ role: m.role as "user" | "assistant", content: m.text })),
      { role: "user", content: input },
    ];
    const response = await engine.chat.completions.create({ messages: llmMessages, temperature: 0.7, max_tokens: 1000 });
    return response;
  }, []);
  async function resetChat() {
    const engine = await ensureEngine();
    if (engine && typeof engine.resetChat === "function") engine.resetChat();
  }
  return { createCompletion, progress, resetChat };
} 
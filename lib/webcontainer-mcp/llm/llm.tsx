"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { CreateMLCEngine, MLCEngine } from "@mlc-ai/web-llm";
import { Loader } from "lucide-react";
import { memo, useRef, useState } from "react";

// Minimal LLM-only hook
function useSimpleLLM() {
  const engineRef = useRef<MLCEngine | null>(null);
  const [status, setStatus] = useState<string>("");

  async function ensureEngine() {
    if (!engineRef.current) {
      setStatus("Loading model...");
      engineRef.current = await CreateMLCEngine(
        "Hermes-3-Llama-3.1-8B-q4f16_1-MLC",
        {
          initProgressCallback: (progress: { progress: number }) =>
            setStatus(`Loading: ${Math.round(progress.progress * 100)}%`),
        }
      );
      setStatus("Model ready");
    }
    return engineRef.current;
  }

  async function chat(input: string): Promise<string> {
    const engine = await ensureEngine();
    const response = await engine.chatCompletion({
      messages: [{ role: "user", content: input }],
      stream: false,
      max_tokens: 800,
      temperature: 0.7,
    });
    return response.choices[0]?.message?.content ?? "";
  }

  async function resetChat() {
    const engine = await ensureEngine();
    if (engine && typeof engine.resetChat === "function") {
      engine.resetChat();
    }
  }

  return { chat, status, resetChat };
}

export const LLMBubble = memo(function LLMBubble() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<
    { role: "user" | "assistant"; text: string }[]
  >([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const { chat, status, resetChat } = useSimpleLLM();

  async function sendMessage(input: string) {
    setMessages((msgs) => [...msgs, { role: "user", text: input }]);
    setLoading(true);
    try {
      const response = await chat(input);
      setMessages((msgs) => [...msgs, { role: "assistant", text: response }]);
    } catch (err) {
      setMessages((msgs) => [
        ...msgs,
        {
          role: "assistant",
          text: "Error: " + (err instanceof Error ? err.message : String(err)),
        },
      ]);
    }
    setLoading(false);
  }

  async function handleResetChat() {
    setLoading(true);
    await resetChat();
    setMessages([]);
    setLoading(false);
  }

  return (
    <>
      <Button
        size="icon"
        className="right-4 bottom-2 z-50 fixed shadow-lg rounded-full"
        aria-label="Open AI Assistant"
        onClick={() => setOpen((open) => !open)}
      >
        <span className="text-2xl">🤖</span>
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent closeButton={false} aria-describedby={undefined}>
          <DialogHeader className="flex flex-row justify-between items-center gap-2 p-4 border-b">
            <div className="flex-1">
              <DialogTitle>AI Assistant</DialogTitle>
            </div>
            <Button
              variant="secondary"
              size="sm"
              className="mr-2"
              onClick={handleResetChat}
              disabled={loading}
              type="button"
            >
              Reset Chat
            </Button>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" aria-label="Close">
                ×
              </Button>
            </DialogClose>
          </DialogHeader>
          <div className="flex-1 space-y-2 p-4 min-h-[200px] max-h-[400px] overflow-y-auto">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`rounded-lg px-3 py-2 max-w-[80%] ${
                  msg.role === "user"
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "mr-auto bg-muted text-muted-foreground"
                }`}
              >
                {msg.text}
              </div>
            ))}
            {messages.length === 0 && !loading && (
              <div className="bg-muted mr-auto px-3 py-2 rounded-lg max-w-[80%] text-muted-foreground">
                No messages yet.
              </div>
            )}
            {loading && (
              <div className="bg-muted mr-auto px-3 py-2 rounded-lg max-w-[80%] text-muted-foreground animate-pulse">
                <Loader className="w-4 h-4 animate-spin" />
              </div>
            )}
          </div>
          <form
            className="flex items-center gap-2 p-4 border-t"
            onSubmit={async (e) => {
              e.preventDefault();
              if (input.trim()) {
                await sendMessage(input);
                setInput("");
              }
            }}
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message…"
              className="flex-1"
              disabled={loading}
            />
            <Button type="submit" disabled={loading || !input.trim()}>
              Send
            </Button>
          </form>
          {status && (
            <div className="px-4 pb-2 text-muted-foreground text-xs">
              {status}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
});

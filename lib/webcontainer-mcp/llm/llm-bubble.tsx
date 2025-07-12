"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Eraser, Loader } from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useMCP } from "../use-mcp";
import { handleResetChat } from "./handlers/handle-reset-chat";
import { handleSendMessage } from "./handlers/handle-send-message";
import { useLLMEngine } from "./llm-engine";
import { buildSystemPrompt } from "./system-prompt";
import type { Message } from "./types";
import { MessageBubble } from "./ui/message-bubble";

const LOCAL_STORAGE_KEY = "llm-messages";

function ProgressBar({ value }: { value: number }) {
  return (
    <div
      style={{
        width: "100%",
        height: "8px",
        background: "#f3f3f3",
        borderRadius: "4px",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div
        style={{
          width: `${value}%`,
          height: "100%",
          background: "#f59e42",
          transition: "width 0.3s",
        }}
      />
    </div>
  );
}

export function _LLMBubble() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const {
    tools,
    handleListTools,
    status: mcpStatus,
    handleCallTool,
  } = useMCP();
  const { createCompletion, progress, resetChat } = useLLMEngine();

  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch {}
    }
  }, []);
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  const handleOpenChange = useCallback(
    async (open: boolean) => {
      setOpen(open);
      if (open) await handleListTools();
    },
    [handleListTools]
  );
  useEffect(() => {
    if (mcpStatus !== "running") setOpen(false);
  }, [mcpStatus]);

  const systemPrompt = useMemo(() => buildSystemPrompt(tools), [tools]);
  const chat = useMemo(() => createCompletion, [createCompletion]);

  async function onSendMessage(input: string) {
    await handleSendMessage(
      input,
      setMessages,
      setLoading,
      chat,
      handleCallTool,
      systemPrompt,
      tools,
      messages
    );
  }

  async function onResetChat() {
    await handleResetChat(setLoading, resetChat, setMessages);
  }

  return (
    <>
      <div
        onClick={(e) => {
          e.stopPropagation();
          if (mcpStatus !== "running") {
            toast.error("MCP server must be running to use the AI Assistant");
            return;
          }
        }}
      >
        <Button
          size="icon"
          aria-label="Open AI Assistant"
          data-enabled={mcpStatus === "running" ? "true" : "false"}
          onClick={() => {
            handleOpenChange(!open);
          }}
          disabled={mcpStatus !== "running"}
        >
          <span className="text-2xl">🤖</span>
        </Button>
      </div>
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent
          side="right"
          className="flex flex-col p-0 w-full"
          showCloseButton={false}
          style={{
            borderLeft: "2px solid #333",
            boxShadow: "0 0 24px 0 rgba(0,0,0,0.4)",
            outline: "none",
          }}
        >
          <SheetHeader className="p-4 border-b">
            <div className="flex flex-row justify-between items-center gap-2">
              <div className="flex flex-col flex-1 items-start gap-2">
                <SheetTitle>AI Assistant</SheetTitle>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge className="px-2 py-1 text-xs cursor-pointer">
                        System Prompt
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent className="text-xs whitespace-pre-wrap">
                      {systemPrompt}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  aria-label="Reset Chat"
                  onClick={onResetChat}
                  disabled={loading}
                  type="button"
                >
                  <Eraser className="w-4 h-4" />
                </Button>
                <SheetClose asChild>
                  <Button size="icon" aria-label="Close" type="button">
                    ×
                  </Button>
                </SheetClose>
              </div>
            </div>
            {progress.progress < 100 && (
              <div className="my-2">
                <div
                  style={{
                    fontSize: "12px",
                    marginBottom: "4px",
                    color: "#f59e42",
                    fontWeight: 500,
                  }}
                >
                  {progress.status}
                </div>
                <ProgressBar value={progress.progress} />
              </div>
            )}
          </SheetHeader>
          <ScrollArea className="flex-1 space-y-2 p-4 ps-2 min-h-[200px] max-h-[400px]">
            <div className="flex flex-col gap-2">
              {messages.map((msg, i) => (
                <MessageBubble key={i} message={msg} index={i} />
              ))}
              {messages.length === 0 && !loading && (
                <div className="bg-muted mr-auto px-3 py-2 max-w-[80%] text-muted-foreground">
                  No messages yet.
                </div>
              )}
              {loading && (
                <div className="bg-muted mr-auto px-3 py-2 max-w-[80%] text-muted-foreground animate-pulse">
                  <Loader className="w-4 h-4 animate-spin" />
                </div>
              )}
            </div>
          </ScrollArea>
          <form
            className="flex items-center gap-2 p-4 border-t"
            onSubmit={async (e: React.FormEvent<HTMLFormElement>) => {
              e.preventDefault();
              e.stopPropagation();
              if (input.trim()) {
                await onSendMessage(input);
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
        </SheetContent>
      </Sheet>
    </>
  );
}

export const LLMBubble = memo(_LLMBubble);

LLMBubble.displayName = "LLMBubble";

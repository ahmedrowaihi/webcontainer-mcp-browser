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
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Eraser, Loader } from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useMCP } from "../hooks/use-mcp";
import { handleResetChat } from "./handlers/handle-reset-chat";
import { handleSendMessage } from "./handlers/handle-send-message";
import { useLLMEngine } from "./llm-engine";
import { getModelById } from "./models";
import { buildSystemPrompt } from "./system-prompt";
import type { Message } from "./types";
import { MessageBubble } from "./ui/message-bubble";
import { ModelSettingsModal } from "../ui/model-settings-modal";

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
    selectedModelId,
    setSelectedModelId,
  } = useMCP();
  const { createCompletion, progress, resetChat } =
    useLLMEngine(selectedModelId);

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
      if (open && mcpStatus === "running") {
        await handleListTools();
      }
    },
    [handleListTools, mcpStatus]
  );

  const systemPrompt = useMemo(() => buildSystemPrompt(tools), [tools]);
  const chat = useMemo(() => createCompletion, [createCompletion]);

  const toolsTooltipContent = useMemo(() => {
    if (tools.length === 0) return "No tools available";
    if (tools.length <= 5) {
      return tools.map((tool) => tool.name).join("\n");
    }
    const firstFive = tools.slice(0, 5).map((tool) => tool.name);
    const remaining = tools.length - 5;
    return `${firstFive.join("\n")}\n+${remaining} more`;
  }, [tools]);

  const currentModel = useMemo(() => {
    return getModelById(selectedModelId);
  }, [selectedModelId]);

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
      <Button
        size="icon"
        aria-label="Open AI Assistant"
        onClick={() => {
          handleOpenChange(!open);
        }}
      >
        <span className="text-2xl">🤖</span>
      </Button>
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent
          side="right"
          className="flex flex-col p-0 w-full sm:max-w-md"
          showCloseButton={false}
          style={{ outline: "none" }}
        >
          <SheetHeader className="p-4 border-b">
            <div className="flex flex-row justify-between items-center gap-2">
              <div className="flex flex-col flex-1 items-start gap-2">
                <div className="flex items-center gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge
                          className="px-2 py-1 text-xs cursor-pointer"
                          style={{ borderRadius: 0 }}
                        >
                          System Prompt
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent className="text-xs whitespace-pre-wrap">
                        {systemPrompt}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge
                          variant={
                            mcpStatus === "running" ? "default" : "secondary"
                          }
                          className="px-2 py-1 text-xs cursor-pointer"
                          style={{ borderRadius: 0 }}
                        >
                          {mcpStatus === "running"
                            ? `${tools.length} tools`
                            : "Chat only"}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent className="text-xs whitespace-pre-wrap">
                        {toolsTooltipContent}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <ModelSettingsModal
                    selectedModelId={selectedModelId}
                    onModelChange={setSelectedModelId}
                  />
                </div>
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
          <ScrollArea className="flex-1 min-h-0">
            <div className="flex flex-col gap-2 p-4 pr-6 pl-4">
              {messages.map((msg, i) => (
                <MessageBubble key={i} message={msg} index={i} />
              ))}
              {messages.length === 0 && !loading && (
                <div className="bg-muted px-3 py-2 w-full text-muted-foreground">
                  No messages yet.
                </div>
              )}
              {loading && (
                <div className="bg-muted px-3 py-2 w-full text-muted-foreground animate-pulse">
                  <Loader className="w-4 h-4 animate-spin" />
                </div>
              )}
            </div>
          </ScrollArea>
          <div className="flex-shrink-0 border-t">
            <form
              className="flex items-center gap-2 p-4"
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
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

export const LLMBubble = memo(_LLMBubble);

LLMBubble.displayName = "LLMBubble";

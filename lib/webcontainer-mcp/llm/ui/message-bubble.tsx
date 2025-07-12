import { cn } from "@/lib/utils";
import type { Message } from "../types";

interface MessageBubbleProps {
  message: Message;
  index: number;
}

export function MessageBubble({ message, index }: MessageBubbleProps) {
  return (
    <div
      key={index}
      className={cn(
        "px-3 py-2",
        message.role === "user"
          ? "bg-primary text-primary-foreground"
          : message.role === "assistant"
          ? "bg-muted text-muted-foreground"
          : "bg-accent text-accent-foreground"
      )}
    >
      {message.text}
    </div>
  );
}

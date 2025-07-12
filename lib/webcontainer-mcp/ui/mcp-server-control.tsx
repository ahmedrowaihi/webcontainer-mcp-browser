import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Status } from "../use-mcp";
import { StatusIndicator } from "./status-indicator";
import { LLMBubble } from "../llm/llm-bubble";

export interface McpServerControlProps {
  status: Status;
  toolCount: number;
  onStart: (processConfig?: {
    command: string;
    args: string[];
    env?: Record<string, string>;
  }) => void;
  onStop: () => void;
}

export function McpServerControl({
  status,
  toolCount,
  onStart,
  onStop,
}: McpServerControlProps) {
  return (
    <Card className="w-full">
      <div className="flex lg:flex-row flex-col lg:justify-between lg:items-center">
        <CardHeader className="flex-shrink-0">
          <CardTitle>WebContainer MCP System</CardTitle>
          <CardDescription>
            Run a real Node.js MCP stdio server in your browser
          </CardDescription>
        </CardHeader>
        <CardContent className="flex sm:flex-row flex-col flex-wrap items-start sm:items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2">
            <StatusIndicator status={status} />
            <span className="font-semibold text-sm">Tools:</span>
            <span className="text-sm">{toolCount}</span>
          </div>
          <div className="flex sm:flex-row flex-col gap-2">
            {status !== "running" && (
              <Button
                onClick={() => onStart()}
                disabled={
                  status === "installing" ||
                  status === "booting" ||
                  status === "mounting"
                }
                size="sm"
                className="w-full sm:w-auto"
              >
                Run Default Server
              </Button>
            )}
            {status === "running" && (
              <Button
                onClick={onStop}
                disabled={status !== "running"}
                variant="destructive"
                size="sm"
                className="w-full sm:w-auto"
              >
                Stop Server
              </Button>
            )}
          </div>
          <div className="w-full sm:w-auto">
            <LLMBubble />
          </div>
        </CardContent>
      </div>
    </Card>
  );
}

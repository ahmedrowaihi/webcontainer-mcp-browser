import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Status } from "../use-webcontainer-mcp";
import { StatusIndicator } from "./status-indicator";

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
    <Card className="flex flex-row justify-between items-center w-full">
      <CardHeader>
        <CardTitle>WebContainer MCP System</CardTitle>
        <CardDescription>
          Run a real Node.js MCP stdio server in your browser
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-row flex-wrap items-center gap-4">
        <StatusIndicator status={status} />
        <span className="font-semibold">Tools:</span> {toolCount}
        <div className="flex gap-2">
          {status !== "running" && (
            <Button
              onClick={() => onStart()}
              disabled={
                status === "installing" ||
                status === "booting" ||
                status === "mounting"
              }
            >
              Run Default MCP Server
            </Button>
          )}
          {status === "running" && (
            <Button
              onClick={onStop}
              disabled={status !== "running"}
              variant="destructive"
            >
              Stop Server
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

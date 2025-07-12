import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import React from "react";

interface ToolOutputProps {
  toolName?: string;
  output?: CallToolResult;
}

export const ToolOutput = ({ toolName, output }: ToolOutputProps) => {
  const lines =
    output?.content?.map((item: any) => item.text).filter(Boolean) || [];

  return (
    <div className="flex flex-col w-full h-full min-h-0 max-h-full overflow-hidden">
      <div className="flex-shrink-0 p-4 border-b border-border">
        <h3 className="font-semibold text-lg">Tool Output</h3>
        <p className="text-muted-foreground text-sm">
          Results from tool executions
        </p>
      </div>
      <div className="flex-1 bg-background min-h-0 max-h-full overflow-hidden">
        <div className="flex-1 min-h-0 max-h-[400px] overflow-hidden">
          <div className="p-4 h-full overflow-y-auto font-mono text-xs">
            <div className="space-y-2">
              {lines.length === 0 && (
                <div className="text-muted-foreground">No output yet.</div>
              )}
              {lines.map((line, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 w-full text-xs"
                >
                  <span className="flex-shrink-0 text-primary text-xs select-none">
                    {toolName}
                  </span>
                  <span className="flex-shrink-0 text-accent text-xs select-none">
                    ~
                  </span>
                  <div className="w-full min-w-0 overflow-x-auto">
                    <span className="text-xs break-words whitespace-pre-wrap">
                      {line}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

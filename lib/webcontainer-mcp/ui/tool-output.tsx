import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import React from "react";
interface ToolOutputProps {
  toolName?: string;
  output?: CallToolResult;
}
export const ToolOutput = ({ toolName, output }: ToolOutputProps) => {
  if (!output) {
    return <div className="text-muted-foreground text-sm">No output yet.</div>;
  }
  return (
    <>
      {output.content ? (
        <div className="text-sm">
          <b>{toolName}:</b>{" "}
          {output.content.map((item: any) => item.text).join(" ")}
        </div>
      ) : (
        <div className="text-muted-foreground text-sm">No output yet.</div>
      )}
    </>
  );
};

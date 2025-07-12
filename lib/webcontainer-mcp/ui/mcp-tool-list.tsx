import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { McpToolCard } from "./mcp-tool";
interface ToolSelectorProps {
  toolForms: Array<{ name: string }>;
  selectedTool: string;
  setSelectedTool: (name: string) => void;
  disabled: boolean;
}

function ToolSelector({
  toolForms,
  selectedTool,
  setSelectedTool,
  disabled,
}: ToolSelectorProps) {
  return (
    <Select
      value={selectedTool}
      onValueChange={setSelectedTool}
      disabled={disabled}
    >
      <SelectTrigger className="mb-2">
        <SelectValue placeholder="Select a tool..." />
      </SelectTrigger>
      <SelectContent>
        {toolForms.map((tool) => (
          <SelectItem key={tool.name} value={tool.name}>
            {tool.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
interface McpToolListProps {
  toolForms: Array<{
    name: string;
    description: string;
    badge: string;
    provider: any;
  }>;
  onCallTool: (toolName: string, values: any) => void;
  onListTools: () => void;
  disabled: boolean;
}
export function McpToolList({
  toolForms,
  onCallTool,
  onListTools,
  disabled,
}: McpToolListProps) {
  const [selectedTool, setSelectedTool] = useState<string>("");
  const activeTool = toolForms.find((tool) => tool.name === selectedTool);

  return (
    <Card className="flex flex-col w-full h-full min-h-0 max-h-full overflow-hidden">
      <CardHeader className="flex-shrink-0">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              Available Tools
            </CardTitle>
            <CardDescription>
              List and manage available MCP tools
            </CardDescription>
          </div>
          <Button
            className="ml-4"
            onClick={onListTools}
            disabled={disabled}
            size="sm"
          >
            List Tools
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col flex-1 min-h-0 max-h-full overflow-hidden">
        {toolForms.length > 0 ? (
          <div className="flex flex-col flex-1 space-y-4 min-h-0 max-h-full overflow-hidden">
            <div className="flex-shrink-0">
              <ToolSelector
                toolForms={toolForms}
                selectedTool={selectedTool}
                setSelectedTool={setSelectedTool}
                disabled={disabled}
              />
            </div>
            {activeTool ? (
              <div className="flex-1 min-h-0 max-h-[400px] overflow-y-auto">
                <McpToolCard
                  key={activeTool.name}
                  tool={activeTool}
                  onCallTool={onCallTool}
                />
              </div>
            ) : (
              <div className="text-muted-foreground text-sm">
                Select a tool to view its form.
              </div>
            )}
          </div>
        ) : (
          <div className="text-muted-foreground text-sm">
            No tools available.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { MousePointerClick } from "lucide-react";
import { AutoForm } from "./autoform/AutoForm";

export function McpToolCard({
  tool,
  onCallTool,
}: {
  tool: {
    name: string;
    description: string;
    badge: string;
    provider: any;
  };
  onCallTool: (toolName: string, values: any) => void;
}) {
  return tool.provider ? (
    <AutoForm
      schema={tool.provider}
      onSubmit={(values) => onCallTool(tool.name, values)}
      withSubmit={false}
      uiComponents={{
        Form: ({ children, ...props }) => (
          <Card className="p-3">
            <form
              {...props}
              className={cn("flex flex-col h-full", props.className)}
            >
              <div className="flex justify-between items-start">
                <Badge>{tool.name}</Badge>
                <div className="flex-shrink-0">
                  <Button type="submit" size="sm">
                    <MousePointerClick className="size-4" />
                  </Button>
                </div>
              </div>
              <p className="text-muted-foreground text-xs">
                {tool.description}
              </p>
              <div>{children}</div>
            </form>
          </Card>
        ),
      }}
    />
  ) : (
    <Card className="p-3">
      <div className="text-red-500 text-xs">
        Tool input schema must be a Zod object
      </div>
    </Card>
  );
}

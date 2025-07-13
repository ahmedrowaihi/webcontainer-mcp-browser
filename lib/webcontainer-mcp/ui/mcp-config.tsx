import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import * as React from "react";
import { cn } from "@/lib/utils";
import { useImperativeHandle } from "react";
import type { Status } from "../hooks/use-mcp";

interface MCPConfigProps {
  status: Status;
  onSubmit: (config: {
    command: string;
    args: string[];
    env?: Record<string, string>;
  }) => void;
}

interface UseAutosizeTextAreaProps {
  textAreaRef: React.MutableRefObject<HTMLTextAreaElement | null>;
  minHeight?: number;
  maxHeight?: number;
  triggerAutoSize: string;
}

export const useAutosizeTextArea = ({
  textAreaRef,
  triggerAutoSize,
  maxHeight = Number.MAX_SAFE_INTEGER,
  minHeight = 0,
}: UseAutosizeTextAreaProps) => {
  const [init, setInit] = React.useState(true);
  React.useEffect(() => {
    const offsetBorder = 6;
    const textAreaElement = textAreaRef.current;
    if (textAreaElement) {
      if (init) {
        textAreaElement.style.minHeight = `${minHeight + offsetBorder}px`;
        if (maxHeight > minHeight) {
          textAreaElement.style.maxHeight = `${maxHeight}px`;
        }
        setInit(false);
      }
      textAreaElement.style.height = `${minHeight + offsetBorder}px`;
      const scrollHeight = textAreaElement.scrollHeight;
      if (scrollHeight > maxHeight) {
        textAreaElement.style.height = `${maxHeight}px`;
      } else {
        textAreaElement.style.height = `${scrollHeight + offsetBorder}px`;
      }
    }
  }, [textAreaRef.current, triggerAutoSize]);
};

export type AutosizeTextAreaRef = {
  textArea: HTMLTextAreaElement;
  maxHeight: number;
  minHeight: number;
};

type AutosizeTextAreaProps = {
  maxHeight?: number;
  minHeight?: number;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const AutosizeTextarea = React.forwardRef<
  AutosizeTextAreaRef,
  AutosizeTextAreaProps
>(
  (
    {
      maxHeight = Number.MAX_SAFE_INTEGER,
      minHeight = 52,
      className,
      onChange,
      value,
      ...props
    }: AutosizeTextAreaProps,
    ref: React.Ref<AutosizeTextAreaRef>
  ) => {
    const textAreaRef = React.useRef<HTMLTextAreaElement | null>(null);
    const [triggerAutoSize, setTriggerAutoSize] = React.useState("");

    useAutosizeTextArea({
      textAreaRef,
      triggerAutoSize: triggerAutoSize,
      maxHeight,
      minHeight,
    });

    useImperativeHandle(ref, () => ({
      textArea: textAreaRef.current as HTMLTextAreaElement,
      focus: () => textAreaRef?.current?.focus(),
      maxHeight,
      minHeight,
    }));

    React.useEffect(() => {
      setTriggerAutoSize(value as string);
    }, [props?.defaultValue, value]);

    return (
      <textarea
        {...props}
        value={value}
        ref={textAreaRef}
        className={cn(
          "flex w-full border border-input bg-background text-foreground px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        onChange={(e) => {
          setTriggerAutoSize(e.target.value);
          onChange?.(e);
        }}
      />
    );
  }
);
AutosizeTextarea.displayName = "AutosizeTextarea";

export function MCPConfig({ status, onSubmit }: MCPConfigProps) {
  const DEFAULT_JSON = `{
    "command": "npx",
    "args": ["-y", "@ahmedrowaihi/azure-mcp-fastmcp"],
    "env": {
      "AZURE_ORG_URL": "https://dev.azure.com/yourorg",
      "AZURE_PERSONAL_ACCESS_TOKEN": "your_token"
    }
  }`;
  const [jsonInput, setJsonInput] = useState<string>(DEFAULT_JSON);
  const [jsonError, setJsonError] = useState<string>("");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("mcp-process-config");
      if (stored) setJsonInput(stored);
    } catch {}
  }, []);
  useEffect(() => {
    try {
      window.localStorage.setItem("mcp-process-config", jsonInput);
    } catch {}
  }, [jsonInput]);

  function handleSubmit() {
    setJsonError("");
    try {
      const parsed = JSON.parse(jsonInput);
      if (!parsed.command || !Array.isArray(parsed.args)) {
        setJsonError("JSON must include 'command' (string) and 'args' (array)");
        return;
      }
      onSubmit(parsed);
    } catch (e: any) {
      setJsonError("Invalid JSON: " + e.message);
    }
  }

  return (
    <Card className="flex flex-col w-full h-full min-h-0 max-h-full overflow-hidden">
      <CardHeader className="flex-shrink-0">
        <CardTitle>Process Configuration</CardTitle>
        <CardDescription>
          Paste or edit the process config JSON for the MCP server you want to
          run.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col flex-1 gap-4 min-h-0 max-h-full overflow-hidden">
        <div className="flex-1 min-h-0 max-h-[400px] overflow-hidden">
          <AutosizeTextarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder={DEFAULT_JSON}
            className="w-full h-full font-mono"
            disabled={status === "running"}
            minHeight={52}
            maxHeight={350}
          />
        </div>
        {jsonError && <div className="text-red-500 text-xs">{jsonError}</div>}
        <div className="flex flex-shrink-0 gap-2">
          <Button
            onClick={handleSubmit}
            disabled={
              status === "running" ||
              status === "installing" ||
              status === "booting" ||
              status === "mounting" ||
              !jsonInput.trim()
            }
          >
            Run Custom MCP Server
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

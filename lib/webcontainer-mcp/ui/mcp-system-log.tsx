import { useState } from "react";
import { Clipboard, Check } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function McpSystemLog({
  output,
  onClear,
}: {
  output: string;
  onClear: () => void;
}) {
  function isSpinnerLine(line: string) {
    const trimmed = line.trim();
    if (trimmed.length < 8) return false;
    // If 80% or more of the line is spinner chars, consider it a spinner
    const spinnerChars = trimmed.replace(/[|/\\-]/g, "").length;
    return spinnerChars / trimmed.length < 0.2;
  }
  const lines = output
    .split(/\r?\n/)
    .filter(Boolean)
    .filter((line) => !isSpinnerLine(line));

  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  return (
    <div className="flex flex-col bg-background border border-border rounded-lg w-full max-w-2xl h-64 overflow-hidden font-mono text-foreground text-xs">
      <div className="flex-1 p-4 min-h-0 overflow-auto">
        <div className="space-y-2">
          {lines.length === 0 && (
            <div className="text-muted-foreground">No logs yet.</div>
          )}
          <TooltipProvider>
            {lines.map((line, idx) => (
              <div
                key={idx}
                className="group flex items-center gap-2 hover:bg-muted rounded w-full min-w-0 max-w-full text-xs cursor-pointer"
              >
                <span className="text-primary text-xs select-none">sudorw</span>
                <span className="text-accent text-xs select-none">~</span>
                <div className="w-full min-w-0 max-w-full overflow-x-auto">
                  <span className="text-xs whitespace-pre">{line}</span>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span
                      className="hover:bg-muted opacity-0 group-hover:opacity-100 ml-2 p-1 rounded transition-colors"
                      onClick={() => {
                        navigator.clipboard.writeText(line);
                        setCopiedIdx(idx);
                        setTimeout(() => setCopiedIdx(null), 1000);
                      }}
                    >
                      {copiedIdx === idx ? (
                        <Check className="w-3 h-3 text-green-500 scale-110 transition-transform duration-150" />
                      ) : (
                        <Clipboard className="w-3 h-3" />
                      )}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    {copiedIdx === idx ? "Copied!" : "Copy"}
                  </TooltipContent>
                </Tooltip>
              </div>
            ))}
          </TooltipProvider>
        </div>
      </div>
      <div className="flex items-center gap-2 bg-muted px-4 py-2 border-t border-border text-xs">
        <span className="text-primary text-xs select-none">sudorw</span>
        <span className="text-accent text-xs select-none">~</span>
        <button
          className="ml-auto text-muted-foreground hover:text-destructive text-xs"
          onClick={onClear}
        >
          Clear
        </button>
      </div>
    </div>
  );
}

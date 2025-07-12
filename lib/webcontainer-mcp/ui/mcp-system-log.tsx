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
    const spinnerChars = trimmed.replace(/[|/\\-]/g, "").length;
    return spinnerChars / trimmed.length < 0.2;
  }
  const lines = output
    .split(/\r?\n/)
    .filter(Boolean)
    .filter((line) => !isSpinnerLine(line));

  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  return (
    <div className="flex flex-col w-full h-full min-h-0 max-h-full overflow-hidden">
      <div className="flex-shrink-0 p-4 border-b border-border">
        <h3 className="font-semibold text-lg">System Log</h3>
        <p className="text-muted-foreground text-sm">
          Real-time server output and logs
        </p>
      </div>
      <div className="flex flex-col flex-1 bg-background min-h-0 max-h-full overflow-hidden">
        <div className="flex-1 min-h-0 max-h-[400px] overflow-hidden">
          <div className="p-4 h-full overflow-y-auto font-mono text-xs">
            <div className="space-y-2">
              {lines.length === 0 && (
                <div className="text-muted-foreground">No logs yet.</div>
              )}
              <TooltipProvider>
                {lines.map((line, idx) => (
                  <div
                    key={idx}
                    className="group flex items-start gap-2 hover:bg-muted w-full text-xs cursor-pointer"
                  >
                    <span className="flex-shrink-0 text-primary text-xs select-none">
                      sudorw
                    </span>
                    <span className="flex-shrink-0 text-accent text-xs select-none">
                      ~
                    </span>
                    <div className="w-full min-w-0 overflow-x-auto">
                      <span className="text-xs break-words whitespace-pre-wrap">
                        {line}
                      </span>
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span
                          className="flex-shrink-0 hover:bg-muted opacity-0 group-hover:opacity-100 ml-2 p-1 transition-colors"
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
        </div>
        <div className="flex flex-shrink-0 items-center gap-2 bg-muted px-4 py-2 border-t border-border text-xs">
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
    </div>
  );
}

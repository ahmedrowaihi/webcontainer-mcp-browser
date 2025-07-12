"use client";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import React from "react";
import type { Status } from "../use-mcp";

const STATUS_COLORS: Record<string, string> = {
  running: "#22c55e",
  error: "#ef4444",
  idle: "#6b7280",
  booting: "#facc15",
  installing: "#60a5fa",
  mounting: "#a78bfa",
};

export interface StatusIndicatorProps {
  status: Status;
  label?: string;
  className?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  label,
  className,
}) => {
  const normalized = status.toLowerCase();
  const displayLabel =
    label ?? normalized.charAt(0).toUpperCase() + normalized.slice(1);
  const color = STATUS_COLORS[normalized] || "#9ca3af";
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2 cursor-pointer">
              <span
                className={cn("rounded-full size-4 animate-pulse")}
                style={{ backgroundColor: color, borderColor: "#e5e7eb" }}
              />
              <span className="font-medium text-sm">{displayLabel}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>{displayLabel}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </span>
  );
};

import { useState } from "react";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ModelSelector } from "./model-selector";

interface ModelSettingsModalProps {
  selectedModelId: string;
  onModelChange: (modelId: string) => void;
  disabled?: boolean;
}

export function ModelSettingsModal({
  selectedModelId,
  onModelChange,
  disabled,
}: ModelSettingsModalProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="p-0 w-8 h-8"
          disabled={disabled}
          title="AI Model Settings"
        >
          <Settings className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>AI Model Settings</DialogTitle>
          <DialogDescription>
            Configure the AI model for the chat assistant. Changes will take
            effect when you start a new conversation.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <ModelSelector
            selectedModelId={selectedModelId}
            onModelChange={onModelChange}
            disabled={disabled}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

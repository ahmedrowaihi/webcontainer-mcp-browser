import { Badge } from "@/components/ui/badge";
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
import { useEffect, useState } from "react";
import {
  AVAILABLE_MODELS,
  DEFAULT_MODEL,
  getModelById,
  type ModelInfo,
} from "../llm/models";

interface ModelSelectorProps {
  selectedModelId: string;
  onModelChange: (modelId: string) => void;
  disabled?: boolean;
}

export function ModelSelector({
  selectedModelId,
  onModelChange,
  disabled,
}: ModelSelectorProps) {
  const [selectedModel, setSelectedModel] = useState<ModelInfo | undefined>(
    getModelById(selectedModelId) || getModelById(DEFAULT_MODEL)
  );

  useEffect(() => {
    const model = getModelById(selectedModelId);
    setSelectedModel(model);
  }, [selectedModelId]);

  const handleModelChange = (modelId: string) => {
    const model = getModelById(modelId);
    if (model) {
      setSelectedModel(model);
      onModelChange(modelId);
    }
  };

  const getCategoryColor = (category: ModelInfo["category"]) => {
    switch (category) {
      case "tiny":
        return "bg-green-100 text-green-800 border-green-200";
      case "small":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "large":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getCategoryLabel = (category: ModelInfo["category"]) => {
    switch (category) {
      case "tiny":
        return "⚡ Tiny";
      case "small":
        return "🚀 Small";
      case "medium":
        return "⚖️ Medium";
      case "large":
        return "🔥 Large";
      default:
        return category;
    }
  };

  return (
    <Card className="w-full min-w-0">
      <CardHeader className="flex-shrink-0">
        <CardTitle>AI Model Selection</CardTitle>
        <CardDescription>
          Choose a model for the AI assistant. Smaller models download faster.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="font-medium text-sm">Select Model:</label>
          <Select
            value={selectedModelId}
            onValueChange={handleModelChange}
            disabled={disabled}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a model..." />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {AVAILABLE_MODELS.map((model) => (
                <SelectItem
                  key={model.id}
                  value={model.id}
                  className="py-3 text-start"
                >
                  <div className="flex justify-between items-start gap-2 w-full">
                    <div className="flex flex-col flex-1 gap-1 min-w-0 text-start">
                      <span className="font-medium text-sm">{model.name}</span>
                      <p className="text-inherit text-xs text-left">
                        {model.description}
                      </p>
                    </div>
                    <div className="flex flex-shrink-0 items-start gap-1 ml-auto">
                      <Badge
                        variant="outline"
                        className={`text-xs ${getCategoryColor(
                          model.category
                        )}`}
                      >
                        {getCategoryLabel(model.category)}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {model.size}
                      </Badge>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedModel && (
          <div className="bg-muted p-3 border">
            <div className="flex justify-between items-start gap-3">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm">{selectedModel.name}</h4>
                <p className="mt-1 text-muted-foreground text-xs">
                  {selectedModel.description}
                </p>
              </div>
              <div className="flex flex-col flex-shrink-0 items-end gap-1">
                <Badge
                  variant="outline"
                  className={`text-xs ${getCategoryColor(
                    selectedModel.category
                  )}`}
                >
                  {getCategoryLabel(selectedModel.category)}
                </Badge>
                <div className="text-muted-foreground text-xs">
                  Size: {selectedModel.size}
                </div>
                <div className="text-muted-foreground text-xs">
                  VRAM: {Math.round(selectedModel.vramMB)} MB
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-1 text-muted-foreground text-xs">
          <p>
            <strong>💡 Recommendation:</strong> Start with a Tiny or Small model
            for faster downloads.
          </p>
          <p>
            <strong>⚡ Tiny models (300-500MB):</strong> Ultra-fast download,
            basic capabilities
          </p>
          <p>
            <strong>🚀 Small models (500MB-1.5GB):</strong> Good balance of
            speed and performance
          </p>
          <p>
            <strong>⚖️ Medium models (1.5-3GB):</strong> Better capabilities,
            longer download
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

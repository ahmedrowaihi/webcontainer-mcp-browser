export interface ModelInfo {
  id: string;
  name: string;
  size: string;
  vramMB: number;
  description: string;
  category: "tiny" | "small" | "medium" | "large";
  lowResource: boolean;
}

export const AVAILABLE_MODELS: ModelInfo[] = [
  // Tiny Models (< 500MB)
  {
    id: "SmolLM2-135M-Instruct-q0f16-MLC",
    name: "SmolLM2 135M",
    size: "360 MB",
    vramMB: 359.69,
    description: "Ultra-lightweight model, fastest download",
    category: "tiny",
    lowResource: true,
  },
  {
    id: "SmolLM2-360M-Instruct-q4f16_1-MLC",
    name: "SmolLM2 360M",
    size: "376 MB", 
    vramMB: 376.06,
    description: "Very small and fast, good for basic tasks",
    category: "tiny",
    lowResource: true,
  },
  {
    id: "SmolLM2-360M-Instruct-q0f16-MLC",
    name: "SmolLM2 360M (q0f16)",
    size: "872 MB",
    vramMB: 871.99,
    description: "Higher quality 360M model",
    category: "tiny",
    lowResource: true,
  },

  // Small Models (500MB - 1.5GB)
  {
    id: "TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC-1k",
    name: "TinyLlama 1.1B",
    size: "675 MB",
    vramMB: 675.24,
    description: "Small but capable model with good performance",
    category: "small",
    lowResource: true,
  },
  {
    id: "Qwen2.5-0.5B-Instruct-q4f16_1-MLC",
    name: "Qwen2.5 0.5B",
    size: "945 MB",
    vramMB: 944.62,
    description: "Qwen family, excellent for its size",
    category: "small",
    lowResource: true,
  },
  {
    id: "Qwen3-0.6B-q4f16_1-MLC",
    name: "Qwen3 0.6B",
    size: "1.4 GB",
    vramMB: 1403.34,
    description: "Latest Qwen3 model, very capable",
    category: "small",
    lowResource: true,
  },

  // Medium Models (1.5GB - 3GB)
  {
    id: "Qwen2.5-1.5B-Instruct-q4f16_1-MLC",
    name: "Qwen2.5 1.5B",
    size: "1.6 GB",
    vramMB: 1629.75,
    description: "Good balance of size and performance",
    category: "medium",
    lowResource: true,
  },
  {
    id: "SmolLM2-1.7B-Instruct-q4f16_1-MLC",
    name: "SmolLM2 1.7B",
    size: "1.8 GB",
    vramMB: 1774.19,
    description: "Larger SmolLM model with better capabilities",
    category: "medium",
    lowResource: true,
  },
  {
    id: "Llama-3.2-1B-Instruct-q4f16_1-MLC",
    name: "Llama 3.2 1B",
    size: "879 MB",
    vramMB: 879.04,
    description: "Meta's compact Llama model",
    category: "small",
    lowResource: true,
  },
  {
    id: "gemma-2-2b-it-q4f16_1-MLC-1k",
    name: "Gemma 2B (1k context)",
    size: "1.6 GB",
    vramMB: 1583.3,
    description: "Google's Gemma model, efficient",
    category: "medium",
    lowResource: true,
  },

  // Larger Models (3GB+)
  {
    id: "Llama-3.2-3B-Instruct-q4f16_1-MLC",
    name: "Llama 3.2 3B",
    size: "2.3 GB",
    vramMB: 2263.69,
    description: "More capable Llama model",
    category: "medium",
    lowResource: true,
  },
  {
    id: "Qwen2.5-3B-Instruct-q4f16_1-MLC",
    name: "Qwen2.5 3B",
    size: "2.5 GB",
    vramMB: 2504.76,
    description: "Powerful 3B model with excellent performance",
    category: "medium",
    lowResource: true,
  },
  {
    id: "Phi-3.5-mini-instruct-q4f16_1-MLC-1k",
    name: "Phi-3.5 Mini (1k context)",
    size: "2.5 GB",
    vramMB: 2520.07,
    description: "Microsoft's efficient Phi model",
    category: "medium",
    lowResource: true,
  },

  // Current default (for reference)
  {
    id: "Llama-3.1-8B-Instruct-q4f32_1-MLC",
    name: "Llama 3.1 8B (Current)",
    size: "6.1 GB",
    vramMB: 6101.01,
    description: "Current default model - large and capable",
    category: "large",
    lowResource: false,
  },
];

export const DEFAULT_MODEL = "SmolLM2-360M-Instruct-q4f16_1-MLC";

export function getModelById(id: string): ModelInfo | undefined {
  return AVAILABLE_MODELS.find(model => model.id === id);
}

export function getModelsByCategory(category: ModelInfo["category"]): ModelInfo[] {
  return AVAILABLE_MODELS.filter(model => model.category === category);
}

export function getLowResourceModels(): ModelInfo[] {
  return AVAILABLE_MODELS.filter(model => model.lowResource);
} 
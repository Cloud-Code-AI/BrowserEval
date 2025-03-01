import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

export const models = [
  { id: "smollm2-135m-instruct", name: "SmolLM2 135M Instruct (360MB)", size: "135M parameters", quantizations: ["q4f16_1", "q4f32_1", "q0f16", "q0f32"] },
  { id: "smollm2-360m-instruct", name: "SmolLM2 360M Instruct (380MB)", size: "360M parameters", quantizations: ["q4f16_1", "q4f32_1", "q0f16", "q0f32"] },
  { id: "smollm2-1.7b-instruct", name: "SmolLM2 1.7B Instruct (1.75GB)", size: "1.7B parameters", quantizations: ["q4f16_1", "q4f32_1"] },
  { id: "llama-3.2-1b-instruct", name: "Llama 3.2 1B Instruct (880MB)", size: "1B parameters", quantizations: ["q4f16_1", "q4f32_1"] },
  { id: "phi-3.5-mini-instruct", name: "Phi 3.5 Mini Instruct (3.6GB)", size: "3.5B parameters", quantizations: ["q4f16_1", "q4f32_1"] },
  { id: "qwen2.5-0.5b-instruct", name: "Qwen2.5 0.5B Instruct (950MB)", size: "0.5B parameters", quantizations: ["q4f16_1", "q4f32_1", "q0f16", "q0f32"] },
  { id: "qwen2.5-1.5b-instruct", name: "Qwen2.5 1.5B Instruct (1.6GB)", size: "1.5B parameters", quantizations: ["q4f16_1", "q4f32_1"] },
  { id: "gemma-2b-it", name: "Gemma 2B Instruct (1.4GB)", size: "2B parameters", quantizations: ["q4f16_1", "q4f32_1"] },
  { id: "tinyllama-1.1b-chat-v0.4", name: "TinyLlama 1.1B Chat (670MB)", size: "1.1B parameters", quantizations: ["q4f16_1", "q4f32_1"] },
];

interface ModelSelectorProps {
  onModelSelect: (modelId: string) => void;
  onQuantizationSelect: (quantization: string) => void;
}

export function ModelSelector({ onModelSelect, onQuantizationSelect }: ModelSelectorProps) {
  const [selectedModel, setSelectedModel] = useState<string>("");

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm text-terminal-muted">Select Model</label>
        <Select 
          onValueChange={(value) => {
            setSelectedModel(value);
            onModelSelect(value);
          }}
        >
          <SelectTrigger className="w-full bg-terminal-border text-terminal-foreground border-terminal-muted">
            <SelectValue placeholder="Choose a model" />
          </SelectTrigger>
          <SelectContent className="bg-terminal-background border-terminal-border">
            {models.map((model) => (
              <SelectItem
                key={model.id}
                value={model.id}
                className="text-terminal-foreground hover:bg-terminal-border hover:text-terminal-accent"
              >
                <div className="flex flex-col">
                  <span>{model.name}</span>
                  <span className="text-xs text-terminal-muted">{model.size}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedModel && (
        <div className="space-y-2">
          <label className="text-sm text-terminal-muted">Select Quantization</label>
          <Select 
            defaultValue="q4f16"
            onValueChange={onQuantizationSelect}
          >
            <SelectTrigger className="w-full bg-terminal-border text-terminal-foreground border-terminal-muted">
              <SelectValue placeholder="Choose quantization" />
            </SelectTrigger>
            <SelectContent className="bg-terminal-background border-terminal-border">
              {models
                .find(m => m.id === selectedModel)
                ?.quantizations.map((quant) => (
                  <SelectItem
                    key={quant}
                    value={quant}
                    className="text-terminal-foreground hover:bg-terminal-border hover:text-terminal-accent"
                  >
                    <div className="flex flex-col">
                      <span>{quant.toUpperCase()}</span>
                    </div>
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
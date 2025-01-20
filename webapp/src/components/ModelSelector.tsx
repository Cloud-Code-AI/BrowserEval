import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const models = [
  { id: "llama-1b-onnx", name: "Llama 1B (ONNX)", size: "1B parameters" },
  { id: "llama-1b-mlc", name: "Llama 1B (MLC)", size: "1B parameters" },
  { id: "tiny-llama", name: "TinyLlama", size: "500M parameters" },
];

interface ModelSelectorProps {
  onModelSelect: (modelId: string) => void;
}

export function ModelSelector({ onModelSelect }: ModelSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm text-terminal-muted">Select Model</label>
      <Select onValueChange={onModelSelect}>
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
  );
}
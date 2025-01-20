import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const models = [
  { id: "llama-3.2-1b-instruct", name: "Llama-3.2-1b-Instruct (MLC)", size: "1B parameters" },
  { id: "smollm2-360m-instruct", name: "SmolLM2-360M-Instruct (MLC)", size: "360M parameters" },
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
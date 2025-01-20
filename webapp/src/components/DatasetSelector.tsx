import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const datasets = [
  { id: "squad", name: "SQuAD", description: "Question Answering Dataset" },
  { id: "glue", name: "GLUE", description: "General Language Understanding" },
  { id: "mmlu", name: "MMLU", description: "Massive Multitask Language Understanding" },
];

interface DatasetSelectorProps {
  onDatasetSelect: (datasetId: string) => void;
}

export function DatasetSelector({ onDatasetSelect }: DatasetSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm text-terminal-muted">Select Dataset</label>
      <Select onValueChange={onDatasetSelect}>
        <SelectTrigger className="w-full bg-terminal-border text-terminal-foreground border-terminal-muted">
          <SelectValue placeholder="Choose a dataset" />
        </SelectTrigger>
        <SelectContent className="bg-terminal-background border-terminal-border">
          {datasets.map((dataset) => (
            <SelectItem
              key={dataset.id}
              value={dataset.id}
              className="text-terminal-foreground hover:bg-terminal-border hover:text-terminal-accent"
            >
              <div className="flex flex-col">
                <span>{dataset.name}</span>
                <span className="text-xs text-terminal-muted">{dataset.description}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
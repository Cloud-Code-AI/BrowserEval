import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const datasets = [
  // Existing MMLU datasets...
  {
    id: "smalleval/mmlu-nano:mmlu_high_school_mathematics.jsonl",
    name: "MMLU - High School Mathematics",
    description: "Mathematics Assessment Questions",
    repo_name: "smalleval/mmlu-nano",
    file_name: "mmlu_high_school_mathematics.jsonl"
  },
  {
    id: "smalleval/mmlu-nano:mmlu_high_school_physics.jsonl",
    name: "MMLU - High School Physics",
    description: "Physics Assessment Questions",
    repo_name: "smalleval/mmlu-nano",
    file_name: "mmlu_high_school_physics.jsonl"
  },
  {
    id: "smalleval/mmlu-nano:mmlu_high_school_biology.jsonl",
    name: "MMLU - High School Biology",
    description: "Biology Assessment Questions",
    repo_name: "smalleval/mmlu-nano",
    file_name: "mmlu_high_school_biology.jsonl"
  },
  {
    id: "smalleval/mmlu-nano:mmlu_high_school_chemistry.jsonl",
    name: "MMLU - High School Chemistry",
    description: "Chemistry Assessment Questions",
    repo_name: "smalleval/mmlu-nano",
    file_name: "mmlu_high_school_chemistry.jsonl"
  },
  {
    id: "smalleval/mmlu-nano:mmlu_high_school_computer_science.jsonl",
    name: "MMLU - High School Computer Science",
    description: "Computer Science Assessment Questions",
    repo_name: "smalleval/mmlu-nano",
    file_name: "mmlu_high_school_computer_science.jsonl"
  },
  {
    id: "smalleval/mmlu-nano:mmlu_high_school_psychology.jsonl",
    name: "MMLU - High School Psychology",
    description: "Psychology Assessment Questions",
    repo_name: "smalleval/mmlu-nano",
    file_name: "mmlu_high_school_psychology.jsonl"
  },
  {
    id: "smalleval/mmlu-nano:mmlu_high_school_us_history.jsonl",
    name: "MMLU - High School US History",
    description: "US History Assessment Questions",
    repo_name: "smalleval/mmlu-nano",
    file_name: "mmlu_high_school_us_history.jsonl"
  },
  {
    id: "smalleval/mmlu-nano:mmlu_high_school_world_history.jsonl",
    name: "MMLU - High School World History",
    description: "World History Assessment Questions",
    repo_name: "smalleval/mmlu-nano",
    file_name: "mmlu_high_school_world_history.jsonl"
  },
  
  // Adding your new datasets
  {
    id: "smalleval/mmlu-nano:mmlu_abstract_algebra.jsonl",
    name: "MMLU - Abstract Algebra",
    description: "Abstract Algebra Assessment Questions",
    repo_name: "smalleval/mmlu-nano",
    file_name: "mmlu_abstract_algebra.jsonl"
  },
  {
    id: "smalleval/mmlu-nano:truthfulqa_helm_None.jsonl",
    name: "TruthfulQA HELM",
    description: "TruthfulQA Assessment Questions",
    repo_name: "smalleval/mmlu-nano",
    file_name: "truthfulqa_helm_None.jsonl"
  },
  {
    id: "smalleval/mmlu-nano:MathQA-TR_None.jsonl",
    name: "MathQA-TR",
    description: "Mathematics Question Answering",
    repo_name: "smalleval/mmlu-nano",
    file_name: "MathQA-TR_None.jsonl"
  },
  {
    id: "smalleval/mmlu-nano:hellaswag_thai_None.jsonl",
    name: "HellaSwag Thai",
    description: "HellaSwag Dataset in Thai",
    repo_name: "smalleval/mmlu-nano",
    file_name: "hellaswag_thai_None.jsonl"
  },
  {
    id: "smalleval/mmlu-nano:ai2_arc_ARC-Easy.jsonl",
    name: "AI2 ARC - Easy",
    description: "AI2 Reasoning Challenge - Easy Questions",
    repo_name: "smalleval/mmlu-nano",
    file_name: "ai2_arc_ARC-Easy.jsonl"
  },
  {
    id: "smalleval/mmlu-nano:ai2_arc_ARC-Challenge.jsonl",
    name: "AI2 ARC - Challenge",
    description: "AI2 Reasoning Challenge - Challenge Questions",
    repo_name: "smalleval/mmlu-nano",
    file_name: "ai2_arc_ARC-Challenge.jsonl"
  }
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
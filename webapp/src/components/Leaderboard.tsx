import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface LeaderboardEntry {
  model: string;
  browser: string;
  system: string;
  dataset: string;
  score: number;
  latency: number;
  memory: number;
}

const sampleData: LeaderboardEntry[] = [
  {
    model: "Llama 1B (ONNX)",
    browser: "Chrome 120",
    system: "M1 Max, 64GB RAM",
    dataset: "SQuAD",
    score: 0.82,
    latency: 45.2,
    memory: 512,
  },
  {
    model: "TinyLlama",
    browser: "Firefox 121",
    system: "i9-12900K, 32GB RAM",
    dataset: "MMLU",
    score: 0.76,
    latency: 38.5,
    memory: 384,
  },
];

export function Leaderboard() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-terminal-accent">Model Evaluation Leaderboard</h2>
      <Table className="border border-terminal-border">
        <TableHeader className="bg-terminal-border">
          <TableRow>
            <TableHead className="text-terminal-foreground">Model</TableHead>
            <TableHead className="text-terminal-foreground">Browser</TableHead>
            <TableHead className="text-terminal-foreground">System</TableHead>
            <TableHead className="text-terminal-foreground">Dataset</TableHead>
            <TableHead className="text-terminal-foreground text-right">Score</TableHead>
            <TableHead className="text-terminal-foreground text-right">Latency (ms)</TableHead>
            <TableHead className="text-terminal-foreground text-right">Memory (MB)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sampleData.map((entry, index) => (
            <TableRow key={index} className="hover:bg-terminal-border/50">
              <TableCell className="font-medium text-terminal-foreground">{entry.model}</TableCell>
              <TableCell className="text-terminal-foreground">{entry.browser}</TableCell>
              <TableCell className="text-terminal-foreground">{entry.system}</TableCell>
              <TableCell className="text-terminal-foreground">{entry.dataset}</TableCell>
              <TableCell className="text-terminal-accent text-right">{(entry.score * 100).toFixed(1)}%</TableCell>
              <TableCell className="text-terminal-secondary text-right">{entry.latency.toFixed(1)}</TableCell>
              <TableCell className="text-terminal-muted text-right">{entry.memory}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
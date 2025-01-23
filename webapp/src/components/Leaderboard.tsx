import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useEffect, useState } from "react";

interface LeaderboardEntry {
  model: string;
  browser: string;
  system: string;
  dataset: string;
  score: number;
  latency: number;
  memory: number;
}

// New function to parse and group CSV data
async function fetchAndProcessData(): Promise<LeaderboardEntry[]> {
  const response = await fetch('/main.csv');
  const csvText = await response.text();
  const rows = csvText.split('\n')
    .slice(1) // Skip header
    .filter(row => row.trim()) // Remove empty rows
    .map(row => {
      const columns = row.split(',');
      return {
        dataset: columns[0],
        model: columns[1],
        score: parseFloat(columns[3]) / 100, // Convert percentage to decimal
        latency: parseFloat(columns[5]),
        memory: parseFloat(columns[7]),
        browser: columns[8],
        system: `${columns[9]}, ${columns[10]}, ${columns[11]}`, // Combine OS, CPU, RAM
      };
    });

  // Group by model, browser, and system
  const groupedData = new Map<string, LeaderboardEntry>();
  rows.forEach(row => {
    const key = `${row.model}-${row.browser}-${row.system}`;
    if (!groupedData.has(key)) {
      groupedData.set(key, row);
    }
  });

  return Array.from(groupedData.values());
}

export function Leaderboard() {
  const [data, setData] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    fetchAndProcessData().then(setData);
  }, []);

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
          {data.map((entry, index) => (
            <TableRow key={index} className="hover:bg-terminal-border/50">
              <TableCell className="font-medium text-terminal-foreground">{entry.model}</TableCell>
              <TableCell className="text-terminal-foreground">{entry.browser}</TableCell>
              <TableCell className="text-terminal-foreground">{entry.system}</TableCell>
              <TableCell className="text-terminal-foreground">{entry.dataset}</TableCell>
              <TableCell className="text-terminal-accent text-right">{(entry.score * 100).toFixed(1)}%</TableCell>
              <TableCell className="text-terminal-secondary text-right">{entry.latency.toFixed(1)}</TableCell>
              <TableCell className="text-terminal-muted text-right">{entry.memory.toFixed(1)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
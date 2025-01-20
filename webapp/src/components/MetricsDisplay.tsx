import { Card } from "@/components/ui/card";

interface Metrics {
  latency: number;
  accuracy: number;
  tokensProcessed: number;
  memoryUsage: number;
  evalTime: number;
}

interface MetricsDisplayProps {
  metrics: Metrics;
}

export function MetricsDisplay({ metrics }: MetricsDisplayProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="bg-terminal-border p-4">
        <div className="text-terminal-muted text-sm">Latency</div>
        <div className="text-terminal-accent text-2xl font-bold">
          {metrics.latency.toFixed(2)} tokens/s
        </div>
      </Card>
      <Card className="bg-terminal-border p-4">
        <div className="text-terminal-muted text-sm">Accuracy</div>
        <div className="text-terminal-accent text-2xl font-bold">
          {(metrics.accuracy * 100).toFixed(1)}%
        </div>
      </Card>
      <Card className="bg-terminal-border p-4">
        <div className="text-terminal-muted text-sm">Tokens Processed</div>
        <div className="text-terminal-accent text-2xl font-bold">
          {metrics.tokensProcessed.toLocaleString()}
        </div>
      </Card>
      <Card className="bg-terminal-border p-4">
        <div className="text-terminal-muted text-sm">Memory Usage</div>
        <div className="text-terminal-accent text-2xl font-bold">
          {(metrics.memoryUsage / (1024 * 1024)).toFixed(1)} MB
        </div>
      </Card>
      <Card className="bg-terminal-border p-4">
        <div className="text-terminal-muted text-sm">Evaluation Time</div>
        <div className="text-terminal-accent text-2xl font-bold">
          {metrics.evalTime.toFixed(1)}s
        </div>
      </Card>
    </div>
  );
}
import { useState } from "react";
import { ModelSelector } from "@/components/ModelSelector";
import { DatasetSelector } from "@/components/DatasetSelector";
import { TerminalOutput } from "@/components/TerminalOutput";
import { MetricsDisplay } from "@/components/MetricsDisplay";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Leaderboard } from "@/components/Leaderboard";

const Index = () => {
  const { toast } = useToast();
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [selectedDataset, setSelectedDataset] = useState<string>("");
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<Array<{ message: string; type: "info" | "error" | "success"; timestamp: string }>>([]);
  const [metrics, setMetrics] = useState({
    latency: 0,
    accuracy: 0,
    tokensProcessed: 0,
    memoryUsage: 0,
    evalTime: 0,
  });

  const handleModelSelect = (modelId: string) => {
    setSelectedModel(modelId);
    addLog(`Selected model: ${modelId}`, "info");
  };

  const handleDatasetSelect = (datasetId: string) => {
    setSelectedDataset(datasetId);
    addLog(`Selected dataset: ${datasetId}`, "info");
  };

  const addLog = (message: string, type: "info" | "error" | "success" = "info") => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, { message, type, timestamp }]);
  };

  const startEvaluation = () => {
    if (!selectedModel || !selectedDataset) {
      toast({
        title: "Error",
        description: "Please select both a model and dataset first",
        variant: "destructive",
      });
      return;
    }

    setIsRunning(true);
    addLog("Starting evaluation...", "info");
    
    // Simulate evaluation progress
    let progress = 0;
    const startTime = Date.now();
    const interval = setInterval(() => {
      progress += 10;
      const elapsedTime = (Date.now() - startTime) / 1000;
      setMetrics({
        latency: Math.random() * 100,
        accuracy: Math.random(),
        tokensProcessed: progress * 1000,
        memoryUsage: Math.random() * 500 * 1024 * 1024,
        evalTime: elapsedTime,
      });
      addLog(`Processing batch ${progress/10}/10...`, "info");
      
      if (progress >= 100) {
        clearInterval(interval);
        setIsRunning(false);
        addLog("Evaluation complete!", "success");
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen p-8 bg-terminal-background">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-terminal-accent">LLM Evaluator</h1>
          <p className="text-terminal-muted">Evaluate language models directly in your browser</p>
        </div>

        <Tabs defaultValue="leaderboard" className="w-full">
          <TabsList className="w-full bg-terminal-border">
            <TabsTrigger value="leaderboard" className="flex-1 data-[state=active]:bg-terminal-accent data-[state=active]:text-black">
              Leaderboard
            </TabsTrigger>
            <TabsTrigger value="run-evals" className="flex-1 data-[state=active]:bg-terminal-accent data-[state=active]:text-black">
              Run Evals
            </TabsTrigger>
          </TabsList>

          <TabsContent value="leaderboard">
            <Leaderboard />
          </TabsContent>

          <TabsContent value="run-evals">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-4">
                <ModelSelector onModelSelect={handleModelSelect} />
                <DatasetSelector onDatasetSelect={handleDatasetSelect} />
                <Button
                  onClick={startEvaluation}
                  disabled={isRunning || !selectedModel || !selectedDataset}
                  className="w-full bg-terminal-accent hover:bg-terminal-accent/90 text-black"
                >
                  {isRunning ? "Running..." : "Start Evaluation"}
                </Button>
              </div>

              <div className="md:col-span-2">
                <MetricsDisplay metrics={metrics} />
              </div>
            </div>

            <TerminalOutput logs={logs} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
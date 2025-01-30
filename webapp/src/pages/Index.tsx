import React, { useState } from "react";
import { ModelSelector } from "@/components/ModelSelector";
import { DatasetSelector, datasets } from "@/components/DatasetSelector";
import { TerminalOutput } from "@/components/TerminalOutput";
import { MetricsDisplay } from "@/components/MetricsDisplay";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Leaderboard } from "@/components/Leaderboard";
import { BrowserAIModel } from "@/models/browser-ai";
import { EvaluationMetrics } from "@/models/types";
import { EvaluationLogsTable } from "@/components/EvaluationLogsTable";
import { AllEvalsScorecard } from "@/components/AllEvalsScorecard";

const Index = () => {
  const { toast } = useToast();

  const [allEvalsResults, setAllEvalsResults] = useState<any[]>([]);
  const [showAllEvalsScorecard, setShowAllEvalsScorecard] = useState(false);

  const [selectedModel, setSelectedModel] = useState<string>("");
  const [selectedDataset, setSelectedDataset] = useState<string>("");

  const [isRunning, setIsRunning] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  const [logs, setLogs] = useState<
    Array<{ message: string; type: "info" | "error" | "success"; timestamp: string }>
  >([]);

  const [metrics, setMetrics] = useState({
    latency: 0,
    accuracy: 0,
    tokensProcessed: 0,
    memoryUsage: 0,
    evalTime: 0,
  });

  const [outputView, setOutputView] = useState<"console" | "logs">("console");

  // Helper to add logs to the console
  const addLog = (message: string, type: "info" | "error" | "success" = "info") => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, { message, type, timestamp }]);
  };

  const handleModelSelect = (modelId: string) => {
    setSelectedModel(modelId);
    setHasStarted(false);
    addLog(`Selected model: ${modelId}`, "info");
  };

  const handleDatasetSelect = (datasetId: string) => {
    setSelectedDataset(datasetId);
    setHasStarted(false);
    addLog(`Selected dataset: ${datasetId}`, "info");
  };

  // Single evaluation
  const startEvaluation = async () => {
    if (!selectedModel || !selectedDataset) {
      toast({
        title: "Error",
        description: "Please select both a model and dataset first",
        variant: "destructive",
      });
      return;
    }

    setIsRunning(true);
    setHasStarted(true);
    setLogs([]);

    addLog("Starting evaluation...", "info");
    console.log(`Selected model: ${selectedModel}`);

    const model = new BrowserAIModel(
      { model: selectedModel },
      {
        onProgress: (_progress: number, updatedMetrics: EvaluationMetrics) => {
          setMetrics(updatedMetrics);
        },
        onComplete: () => {
          setIsRunning(false);
        },
        onLog: (message: string, type: "info" | "error" | "success") => {
          addLog(message, type);
        },
      }
    );

    try {
      await model.evaluate(selectedDataset);
    } catch (error) {
      setIsRunning(false);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred during evaluation",
        variant: "destructive",
      });
    } finally {
      model.cleanup();
    }
  };

  // Collect system info to help create GitHub issue
  const getSystemInfo = async () => {
    const ua = navigator.userAgent;
    const browserInfo = {
      chrome: ua.includes("Chrome"),
      firefox: ua.includes("Firefox"),
      safari: ua.includes("Safari"),
      edge: ua.includes("Edg"),
    };
    const browser = Object.entries(browserInfo).find(([_, has]) => has)?.[0] || "unknown";

    const ramInfo = (navigator as Navigator & { deviceMemory?: number }).deviceMemory
      ? `${(navigator as Navigator & { deviceMemory?: number }).deviceMemory}GB`
      : "Not Available";

    let gpuInfo = "Not Available";
    try {
      // Try WebGPU first
      if ("gpu" in navigator) {
        const adapter = await (navigator as any).gpu.requestAdapter();
        if (adapter) {
          gpuInfo = (await adapter.requestAdapterInfo()).name;
        }
      } else {
        // fallback to WebGL
        const canvas = document.createElement("canvas");
        const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
        if (gl) {
          const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
          if (debugInfo) {
            gpuInfo = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
          }
        }
      }
    } catch (e) {
      console.error("Failed to get GPU info:", e);
    }

    return {
      os: navigator.platform,
      browser: `${browser} ${
        navigator.appVersion.match(/(?:Chrome|Firefox|Safari|Edge)\/(\d+)/)?.[1] || ""
      }`,
      ram: ramInfo,
      cpu: navigator.hardwareConcurrency ? `${navigator.hardwareConcurrency} cores` : "unknown",
      gpu: gpuInfo,
    };
  };

  // Create GitHub Issue from the evaluated metrics
  const createGitHubIssue = async () => {
    const systemInfo = await getSystemInfo();
    const timestamp = new Date().toISOString().replace("T", " ").split(".")[0];
    const accuracy = (metrics.accuracy * 100).toFixed(1);
    const latency = metrics?.latency ?? 0;
    const tokensPerSec = metrics.evalTime ? metrics.tokensProcessed / metrics.evalTime : 0;
    const memUsage = metrics?.memoryUsage ?? 0;

    const issueTitle = `[Eval Results] ${selectedModel} on ${selectedDataset} - ${accuracy}% Accuracy`;
    const issueBody = `## Evaluation Results

### Metadata
- **Dataset**: ${selectedDataset}
- **Model**: ${selectedModel}

### Performance Metrics
- **Accuracy**: ${accuracy}%
- **Average Latency**: ${latency.toFixed(2)}ms
- **Tokens/Second**: ${tokensPerSec.toFixed(2)}
- **Memory Usage**: ${(memUsage / (1024 * 1024)).toFixed(2)}MB

### System Information
- **Browser**: ${systemInfo.browser}
- **OS**: ${systemInfo.os}
- **CPU**: ${systemInfo.cpu}
- **RAM**: ${systemInfo.ram}
- **GPU**: ${systemInfo.gpu || "Not Available"}
- **Timestamp**: ${timestamp}
`;

    const encodedTitle = encodeURIComponent(issueTitle);
    const encodedBody = encodeURIComponent(issueBody);
    const issueUrl = `https://github.com/Cloud-Code-AI/smalleval/issues/new?title=${encodedTitle}&body=${encodedBody}`;
    window.open(issueUrl, "_blank");
  };

  const runAllEvaluations = async () => {
    if (!selectedModel) {
      toast({
        title: "Error",
        description: "Please select a model first",
        variant: "destructive",
      });
      return;
    }

    setLogs([]); // Clear logs from previous runs
    setIsRunning(true);
    setHasStarted(true);
    addLog("Starting all dataset evaluations...", "info");

    const model = new BrowserAIModel(
      { model: selectedModel },
      {
        onProgress: () => {},
        onComplete: () => {},
        onLog: (message: string, type: "info" | "error" | "success") => {
          addLog(message, type);
        },
      }
    );

    const resultsArr: any[] = [];

    try {
      // Preload the model once
      await (model as any).browserAI.loadModel(selectedModel);

      for (const ds of datasets) {
        addLog(`Evaluating dataset: ${ds.name}`, "info");
        const startTime = performance.now();
        const outcome: EvaluationMetrics = await model.evaluate(ds.id); // Explicitly type outcome

        const endTime = performance.now();

        resultsArr.push({
          datasetId: ds.id,
          datasetName: ds.name,
          metrics: { 
            accuracy: outcome.accuracy, 
            evalTime: outcome.evalTime, 
            tokensProcessed: outcome.tokensProcessed, 
            memoryUsage: outcome.memoryUsage, 
            latency: outcome.latency 
          },
          evalTime: (endTime - startTime) / 1000,
        });

      }

      setAllEvalsResults(resultsArr);
      setShowAllEvalsScorecard(true);
      addLog("All dataset evaluations complete!", "success");
    } catch (err: any) {
      addLog(`Error in all-evals: ${err.message}`, "error");
    } finally {
      setIsRunning(false);
      model.cleanup();
    }
  };

  return (
    <div className="min-h-screen p-8 bg-terminal-background">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-terminal-accent">
            LLM Evaluator
          </h1>
          <p className="text-terminal-muted">
            Evaluate language models directly in your browser
          </p>
        </div>

        <Tabs defaultValue="leaderboard" className="w-full">
          <TabsList className="w-full bg-terminal-border">
            <TabsTrigger
              value="leaderboard"
              className="flex-1 data-[state=active]:bg-terminal-accent data-[state=active]:text-black"
            >
              Leaderboard
            </TabsTrigger>
            <TabsTrigger
              value="run-evals"
              className="flex-1 data-[state=active]:bg-terminal-accent data-[state=active]:text-black"
            >
              Run Evals
            </TabsTrigger>
          </TabsList>

          {/* Leaderboard tab */}
          <TabsContent value="leaderboard">
            <Leaderboard />
          </TabsContent>

          {/* Run Evals tab */}
          <TabsContent value="run-evals">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Left panel with model/dataset selection and buttons */}
              <div className="space-y-4">
                <ModelSelector onModelSelect={handleModelSelect} />
                <DatasetSelector onDatasetSelect={handleDatasetSelect} />

                {/* Single dataset evaluation */}
                <Button
                  onClick={startEvaluation}
                  disabled={isRunning || !selectedModel || !selectedDataset}
                  className="w-full bg-terminal-accent hover:bg-terminal-accent/90 text-black"
                >
                  {isRunning ? "Running..." : "Start Evaluation"}
                </Button>

                {/* Run all datasets evaluation */}
                {/* NEW BUTTON: RUN ALL EVALS */}
                <Button
                onClick={runAllEvaluations}
                disabled={isRunning || !selectedModel}
                className="w-full bg-terminal-accent hover:bg-terminal-accent/90 text-black"
                  >
                {isRunning ? "Running All..." : "Run ALL Evals"}
              </Button>
              </div>

              {/* Right panel with metrics */}
              <div className="md:col-span-2">
                <MetricsDisplay metrics={metrics} />
              </div>
            </div>

            {/* Scoreboard after "Run All Evals" */}
            {showAllEvalsScorecard && (
              <AllEvalsScorecard
                results={allEvalsResults}
                onClose={() => setShowAllEvalsScorecard(false)}
              />
            )}

            {/* Console/Logs toggles + GitHub issue creation */}
            <div className="mt-4 mb-2 flex justify-end space-x-2">
              <Button
                variant={outputView === "console" ? "default" : "outline"}
                onClick={() => setOutputView("console")}
                size="sm"
                className="text-terminal-accent"
              >
                Console View
              </Button>
              <Button
                variant={outputView === "logs" ? "default" : "outline"}
                onClick={() => setOutputView("logs")}
                size="sm"
                className="text-terminal-accent"
              >
                Logs View
              </Button>

              {!isRunning && hasStarted && (
                <button
                  onClick={createGitHubIssue}
                  className="px-4 py-2 bg-[#2da44e] text-white rounded hover:bg-[#2da44e]/90 flex items-center gap-2"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.137 20.167 22 16.42 22 12c0-5.523-4.477-10-10-10z" />
                  </svg>
                  Create GitHub Issue
                </button>
              )}
            </div>

            {/* Terminal or Logs View */}
            {outputView === "console" ? (
              <TerminalOutput logs={logs} />
            ) : (
              <div className="bg-terminal-foreground rounded-lg p-4">
                {metrics?.logs ? (
                  <EvaluationLogsTable
                    logs={metrics.logs}
                    metadata={{
                      dataset: selectedDataset,
                      model: selectedModel,
                      evaluationType: "evaluation",
                    }}
                    metrics={metrics}
                  />
                ) : (
                  <p className="text-terminal-muted">
                    No evaluation logs available. Run an evaluation to see results.
                  </p>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
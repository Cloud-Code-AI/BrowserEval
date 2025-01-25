import React from 'react';
import { EvaluationLog } from '@/models/types';

interface EvaluationLogsTableProps {
  logs: EvaluationLog[];
  metadata: {
    dataset: string;
    model: string;
    evaluationType: string;
  };
  metrics: {
    averageLatency: number;
    tokensPerSecond: number;
    memoryUsage: number;
  };
}

interface EvaluationResults {
  systemInfo: {
    os: string;
    browser: string;
    ram: string;
    cpu: string;
    gpu?: string;
  };
  metrics: any;
  metadata: {
    dataset: string;
    model: string;
    evaluationType: string;
  };
  logs: EvaluationLog[];
}

export const EvaluationLogsTable: React.FC<EvaluationLogsTableProps> = ({ logs, metadata, metrics }) => {
  const parsePrompt = (log: EvaluationLog) => {
    if (log.type === 'math') {
      // For math questions, use the question directly
      return {
        question: log.question || '',
        choices: []
      };
    } else {
      // For multiple choice questions, parse from prompt
      const questionMatch = log.prompt.match(/Question: (.*?)\nChoices:/);
      const choicesMatch = log.prompt.match(/Choices:\nA\) (.*?)\nB\) (.*?)\nC\) (.*?)\nD\) (.*?)\nAnswer:/);

      return {
        question: questionMatch ? questionMatch[1] : log.question || '',
        choices: choicesMatch ? [
          choicesMatch[1],
          choicesMatch[2],
          choicesMatch[3],
          choicesMatch[4]
        ] : []
      };
    }
  };

  // Save results to JSON
  const saveResults = () => {
    const results: EvaluationResults = {
      systemInfo: {
        os: navigator.platform,
        browser: navigator.userAgent,
        ram: 'Not Available',
        cpu: navigator.hardwareConcurrency ? `${navigator.hardwareConcurrency} cores` : 'unknown',
      },
      metrics: metrics,
      metadata,
      logs,
    };

    // Create and download JSON file
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `evaluation-results-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end mb-4 gap-4">
        <button
          onClick={saveResults}
          className="px-4 py-2 bg-terminal-accent text-white rounded hover:bg-terminal-accent/90"
        >
          Save Results
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto border-collapse">
          <thead>
            <tr className="border-b border-terminal-border">
              <th className="px-4 py-2 text-left text-black">Question & Choices</th>
              <th className="px-4 py-2 text-center text-black w-24">Predicted</th>
              <th className="px-4 py-2 text-center text-black w-24">Expected</th>
              <th className="px-4 py-2 text-center text-black w-24">Status</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log, index) => {
              const { question, choices } = parsePrompt(log);
              return (
                <tr key={index} className="border-b border-terminal-border/50">
                  <td className="px-4 py-2 text-black">
                    <div>
                      <p className="font-medium mb-2">{question}</p>
                      {choices.length > 0 && (
                        <div className="grid grid-cols-2 gap-2 text-sm text-black">
                          {choices.map((choice, idx) => (
                            <div key={idx}>
                              {String.fromCharCode(65 + idx)}) {choice}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2 text-center text-black">
                    {log.predictedAnswer}
                  </td>
                  <td className="px-4 py-2 text-center text-black">
                    {log.expectedAnswer}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      log.isCorrect 
                        ? 'bg-green-500/20 text-green-800' 
                        : 'bg-red-500/20 text-red-800'
                    }`}>
                      {log.isCorrect ? 'Correct' : 'Incorrect'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
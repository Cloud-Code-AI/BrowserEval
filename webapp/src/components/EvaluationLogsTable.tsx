import React from 'react';
import { EvaluationLog } from '@/models/types';

interface EvaluationLogsTableProps {
  logs: EvaluationLog[];
}

interface EvaluationResults {
  systemInfo: {
    os: string;
    browser: string;
    ram: string;
    cpu: string;
    gpu?: string;
  };
  metrics: {
    accuracy: number;
    totalQuestions: number;
    averageLatency: number;
    timestamp: string;
  };
  logs: EvaluationLog[];
}

export const EvaluationLogsTable: React.FC<EvaluationLogsTableProps> = ({ logs }) => {
  const parsePrompt = (prompt: string) => {
    const questionMatch = prompt.match(/Question: (.*?)\nChoices:/);
    const choicesMatch = prompt.match(/Choices:\nA\) (.*?)\nB\) (.*?)\nC\) (.*?)\nD\) (.*?)\nAnswer:/);

    return {
      question: questionMatch ? questionMatch[1] : '',
      choices: choicesMatch ? [
        choicesMatch[1],
        choicesMatch[2],
        choicesMatch[3],
        choicesMatch[4]
      ] : []
    };
  };

  // Get system information
  const getSystemInfo = () => {
    const ua = navigator.userAgent;
    const browserInfo = {
      chrome: ua.includes('Chrome'),
      firefox: ua.includes('Firefox'),
      safari: ua.includes('Safari'),
      edge: ua.includes('Edg'),
    };

    const browser = Object.entries(browserInfo).find(([_, has]) => has)?.[0] || 'unknown';
    
    return {
      os: navigator.platform,
      browser: `${browser} ${navigator.appVersion.match(/(?:Chrome|Firefox|Safari|Edge)\/(\d+)/)?.[1] || ''}`,
      ram: `${navigator.deviceMemory || 'unknown'}GB`,
      cpu: navigator.hardwareConcurrency ? `${navigator.hardwareConcurrency} cores` : 'unknown',
    };
  };

  // Calculate metrics
  const calculateMetrics = () => {
    const correctAnswers = logs.filter(log => log.isCorrect).length;
    const accuracy = correctAnswers / logs.length;

    return {
      accuracy,
      totalQuestions: logs.length,
      averageLatency: 0, // You'll need to track latency per question if needed
      timestamp: new Date().toISOString(),
    };
  };

  // Save results to JSON
  const saveResults = () => {
    const results: EvaluationResults = {
      systemInfo: getSystemInfo(),
      metrics: calculateMetrics(),
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

  const createGitHubIssue = () => {
    const results: EvaluationResults = {
      systemInfo: getSystemInfo(),
      metrics: calculateMetrics(),
      logs,
    };

    const timestamp = new Date().toISOString().split('T')[0];
    const accuracy = (calculateMetrics().accuracy * 100).toFixed(1);
    
    const issueTitle = `[Eval Results] ${timestamp} - ${accuracy}% Accuracy`;
    const issueBody = `## Evaluation Results

### Summary
- **Accuracy**: ${accuracy}%
- **Total Questions**: ${logs.length}
- **System Info**: ${results.systemInfo.browser} on ${results.systemInfo.os}
- **CPU**: ${results.systemInfo.cpu}
- **RAM**: ${results.systemInfo.ram}
- **Timestamp**: ${timestamp}
`;

    // GitHub's new issue URL with pre-filled title and body
    const encodedTitle = encodeURIComponent(issueTitle);
    const encodedBody = encodeURIComponent(issueBody);
    const issueUrl = `https://github.com/Cloud-Code-AI/smalleval/issues/new?title=${encodedTitle}&body=${encodedBody}`;
    
    // Open in new tab
    window.open(issueUrl, '_blank');
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end mb-4 gap-4">
        <button
          onClick={createGitHubIssue}
          className="px-4 py-2 bg-[#2da44e] text-white rounded hover:bg-[#2da44e]/90 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.137 20.167 22 16.42 22 12c0-5.523-4.477-10-10-10z" />
          </svg>
          Create GitHub Issue
        </button>
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
              const { question, choices } = parsePrompt(log.prompt);
              console.log(question, choices);
              return (
                <tr key={index} className="border-b border-terminal-border/50">
                  <td className="px-4 py-2 text-black">
                    <div>
                      <p className="font-medium mb-2">{question}</p>
                      <div className="grid grid-cols-2 gap-2 text-sm text-black">
                        {choices.map((choice, idx) => (
                          <div key={idx}>
                            {String.fromCharCode(65 + idx)}) {choice}
                          </div>
                        ))}
                      </div>
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
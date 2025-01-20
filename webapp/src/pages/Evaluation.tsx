import { useState } from 'react';
import { EvaluationLogsTable } from '../components/EvaluationLogsTable';

export function Evaluation() {
  const [activeTab, setActiveTab] = useState<'metrics' | 'logs'>('metrics');

  return (
    <div className="container mx-auto p-4">
      {/* Add tab buttons */}
      <div className="mb-4 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('metrics')}
            className={`${
              activeTab === 'metrics'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Metrics
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`${
              activeTab === 'logs'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Evaluation Logs
          </button>
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === 'metrics' ? (
        // Your existing metrics content
        <div>{/* ... */}</div>
      ) : (
        // New logs table
        <div className="mt-4">
          {metrics && metrics.logs ? (
            <EvaluationLogsTable logs={metrics.logs} />
          ) : (
            <p className="text-gray-500">No evaluation logs available</p>
          )}
        </div>
      )}
    </div>
  );
} 
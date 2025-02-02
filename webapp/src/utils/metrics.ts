export function saveMetricsToFile(metrics: any, modelName: string, datasetName: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `evalOut/${timestamp}_${modelName}_${datasetName}.json`;

  // Create metrics object with additional metadata
  const metricsWithMeta = {
    timestamp: new Date().toISOString(),
    model: modelName,
    dataset: datasetName,
    metrics: metrics,
    systemInfo: {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      cores: navigator.hardwareConcurrency,
    }
  };

  // Create a blob and trigger download
  const blob = new Blob([JSON.stringify(metricsWithMeta, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
} 
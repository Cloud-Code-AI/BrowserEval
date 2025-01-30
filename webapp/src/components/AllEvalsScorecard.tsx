// /Users/manmohan/SauravBrowserAI/smalleval/webapp/src/components/AllEvalsScorecard.tsx

import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { EvaluationMetrics } from "@/models/types";

// This shape matches how we stored them in the runAllEvals logic
interface AllEvalsResult {
  datasetId: string;
  datasetName: string;
  metrics: EvaluationMetrics;
}

interface AllEvalsScorecardProps {
  results: AllEvalsResult[];
  onClose: () => void;
}

export const AllEvalsScorecard: React.FC<AllEvalsScorecardProps> = ({
  results,
  onClose,
}) => {
  const scorecardRef = useRef<HTMLDivElement>(null);

  const exportToPdf = async () => {
    if (!scorecardRef.current) return;

    try {
      // First convert the component DOM to a canvas
      const canvas = await html2canvas(scorecardRef.current);
      const imgData = canvas.toDataURL("image/png");

      // Then pipe that image into jsPDF
      const pdf = new jsPDF("p", "pt", "a4");
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save("all-evals-scorecard.pdf");
    } catch (err) {
      console.error("Failed to export PDF:", err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white max-w-3xl w-full rounded-lg p-4 shadow-lg relative">
        <h2 className="text-2xl font-bold mb-4 text-terminal-accent">
          All Datasets Scorecard
        </h2>

        <div className="max-h-[60vh] overflow-y-auto" ref={scorecardRef}>
          <table className="w-full border border-terminal-border">
            <thead className="sticky top-0 bg-terminal-border">
              <tr>
                <th className="px-4 py-2 text-terminal-foreground">Dataset</th>
                <th className="px-4 py-2 text-terminal-foreground text-right">
                  Accuracy
                </th>
                <th className="px-4 py-2 text-terminal-foreground text-right">
                  Time (s)
                </th>
                <th className="px-4 py-2 text-terminal-foreground text-right">
                  Tokens/s
                </th>
                <th className="px-4 py-2 text-terminal-foreground text-right">
                  Memory (MB)
                </th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, idx) => {
                const accuracy = (r.metrics.accuracy * 100).toFixed(1);
                const totalTime = r.metrics.evalTime.toFixed(2);
                const tokensPerSecond = (
                  r.metrics.tokensProcessed / r.metrics.evalTime
                ).toFixed(1);
                const memMB = (r.metrics.memoryUsage / (1024 * 1024)).toFixed(2);

                return (
                  <tr
                    key={idx}
                    className="border-b border-terminal-border hover:bg-terminal-border/20"
                  >
                    <td className="px-4 py-2 text-terminal-foreground font-medium">
                      {r.datasetName}
                    </td>
                    <td className="px-4 py-2 text-right text-terminal-accent">
                      {accuracy}%
                    </td>
                    <td className="px-4 py-2 text-right text-terminal-accent">
                      {totalTime}
                    </td>
                    <td className="px-4 py-2 text-right text-terminal-accent">
                      {tokensPerSecond}
                    </td>
                    <td className="px-4 py-2 text-right text-terminal-accent">
                      {memMB}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end space-x-2 mt-4">
          <Button onClick={exportToPdf} className="bg-green-600 hover:bg-green-500">
            Export PDF
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
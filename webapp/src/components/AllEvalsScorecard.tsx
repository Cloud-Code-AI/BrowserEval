import { Button } from "@/components/ui/button";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { EvaluationMetrics } from "@/models/types";


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
      const canvas = await html2canvas(scorecardRef.current);
      const imgData = canvas.toDataURL("image/png");

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

  const exportToCsv = () => {
    if (!results || results.length === 0) return;

    const headers = ["Dataset", "Accuracy (%)", "Time (s)", "Tokens/s", "Memory (MB)"];
    const csvRows = [];

    csvRows.push(headers.join(","));

    results.forEach(r => {
      const accuracy = (r.metrics.accuracy * 100).toFixed(1);
      const totalTime = r.metrics.evalTime.toFixed(2);
      const tokensPerSecond = (r.metrics.tokensProcessed / r.metrics.evalTime).toFixed(1);
      const memMB = (r.metrics.memoryUsage / (1024 * 1024)).toFixed(2);
      csvRows.push([r.datasetName, accuracy, totalTime, tokensPerSecond, memMB].join(","));
    });

    const csvContent = csvRows.join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "all-evals-scorecard.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
          <Button onClick={exportToCsv} className="bg-blue-600 hover:bg-blue-500">
            Export CSV
          </Button>
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
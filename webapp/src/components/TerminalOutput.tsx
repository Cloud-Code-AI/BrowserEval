import { useEffect, useRef } from "react";

interface LogEntry {
  message: string;
  type: "info" | "error" | "success";
  timestamp: string;
}

interface TerminalOutputProps {
  logs: LogEntry[];
}

export function TerminalOutput({ logs }: TerminalOutputProps) {
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div
      ref={terminalRef}
      className="bg-terminal-background border border-terminal-border rounded-lg p-4 h-[300px] overflow-y-auto font-mono text-sm"
    >
      {logs.map((log, index) => (
        <div
          key={index}
          className={`py-1 animate-fade-up ${
            log.type === "error"
              ? "text-red-400"
              : log.type === "success"
              ? "text-green-400"
              : "text-terminal-foreground"
          }`}
        >
          <span className="text-terminal-muted">{log.timestamp}</span>{" "}
          <span className="terminal-cursor">{log.message}</span>
        </div>
      ))}
    </div>
  );
}
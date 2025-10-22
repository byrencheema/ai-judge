import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../api/client";
import { EvaluationRunSummary } from "../types";
import { Link } from "react-router-dom";

const RunPage = () => {
  const { data: queues } = useQuery<string[]>({
    queryKey: ["queues"],
    queryFn: () => apiClient.get<string[]>("/api/queues")
  });

  const [selectedQueue, setSelectedQueue] = useState<string>("");
  const [summary, setSummary] = useState<EvaluationRunSummary | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const handleRun = async () => {
    setIsRunning(true);
    setSummary(null);
    setStatus("Running judges...");
    setError(null);

    try {
      const payload = selectedQueue ? { queueId: selectedQueue } : {};
      const response = await apiClient.post<EvaluationRunSummary>("/api/evaluate", payload);
      setSummary(response);
      setStatus("Run completed");
    } catch (runError) {
      const message = runError instanceof Error ? runError.message : "Failed to run evaluations";
      setError(message);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <section className="space-y-8">
      <header>
        <h1 className="text-3xl font-semibold">Run AI judges</h1>
        <p className="text-sm text-zinc-400 mt-2">
          Execute configured judges across imported submissions and record the verdicts.
        </p>
      </header>

      <div className="bg-panel/40 border border-slate/60 rounded-lg p-6 space-y-4">
        <div>
          <label className="block text-sm text-zinc-400 mb-2">Queue</label>
          <select
            value={selectedQueue}
            onChange={(event) => setSelectedQueue(event.target.value)}
            className="w-80 bg-background border border-slate/60 rounded px-3 py-2"
          >
            <option value="">All queues</option>
            {queues?.map((queue) => (
              <option key={queue} value={queue}>
                {queue}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={handleRun}
          disabled={isRunning}
          className="px-4 py-2 bg-accent/80 hover:bg-accent text-black rounded-md"
        >
          {isRunning ? "Running..." : "Run AI judges"}
        </button>
        {status && <p className="text-sm text-zinc-400">{status}</p>}
        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>

      {summary && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-slate/60 rounded-lg p-4 bg-panel/40">
              <p className="text-xs text-zinc-500 uppercase">Planned</p>
              <p className="text-3xl font-semibold mt-2">{summary.planned}</p>
            </div>
            <div className="border border-slate/60 rounded-lg p-4 bg-panel/40">
              <p className="text-xs text-zinc-500 uppercase">Completed</p>
              <p className="text-3xl font-semibold mt-2 text-green-400">{summary.completed}</p>
            </div>
            <div className="border border-slate/60 rounded-lg p-4 bg-panel/40">
              <p className="text-xs text-zinc-500 uppercase">Failed</p>
              <p className="text-3xl font-semibold mt-2 text-red-400">{summary.failed}</p>
            </div>
          </div>
          <Link
            to="/results"
            className="inline-flex px-4 py-2 bg-accent/80 hover:bg-accent text-black rounded-md"
          >
            View results
          </Link>
        </div>
      )}
    </section>
  );
};

export default RunPage;

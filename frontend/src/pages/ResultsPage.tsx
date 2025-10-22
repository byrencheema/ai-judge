import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../api/client";
import { Evaluation, Judge, Question } from "../types";

const ResultsPage = () => {
  const [selectedJudges, setSelectedJudges] = useState<number[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [selectedVerdicts, setSelectedVerdicts] = useState<string[]>([]);

  const { data: judges } = useQuery<Judge[]>({
    queryKey: ["judges"],
    queryFn: () => apiClient.get<Judge[]>("/api/judges")
  });

  const { data: questions } = useQuery<Question[]>({
    queryKey: ["questions"],
    queryFn: () => apiClient.get<Question[]>("/api/questions")
  });

  const queryKey = ["evaluations", selectedJudges, selectedQuestions, selectedVerdicts] as const;
  const { data: evaluations, isLoading } = useQuery<Evaluation[]>({
    queryKey,
    queryFn: () => {
      const params = new URLSearchParams();
      if (selectedJudges.length) params.set("judgeIds", selectedJudges.join(","));
      if (selectedQuestions.length) params.set("questionIds", selectedQuestions.join(","));
      if (selectedVerdicts.length) params.set("verdicts", selectedVerdicts.join(","));
      const query = params.toString();
      return apiClient.get<Evaluation[]>(`/api/evaluations${query ? `?${query}` : ""}`);
    }
  });

  const passRate = useMemo(() => {
    if (!evaluations || evaluations.length === 0) return null;
    const passed = evaluations.filter((evaluation) => evaluation.verdict === "pass").length;
    return {
      passed,
      total: evaluations.length,
      percent: Math.round((passed / evaluations.length) * 100)
    };
  }, [evaluations]);

  const toggleSelection = <T extends string | number>(
    value: T,
    current: T[],
    setter: (next: T[]) => void
  ) => {
    if (current.includes(value)) {
      setter(current.filter((item) => item !== value));
    } else {
      setter([...current, value]);
    }
  };

  return (
    <section className="space-y-8">
      <header>
        <h1 className="text-3xl font-semibold">Results</h1>
        <p className="text-sm text-zinc-400 mt-2">
          Inspect verdicts, reasoning, and filter across judges or questions.
        </p>
      </header>

      <div className="grid md:grid-cols-3 gap-6 bg-panel/40 border border-slate/60 rounded-lg p-6 text-sm">
        <div>
          <h3 className="text-xs uppercase text-zinc-500 mb-2">Judges</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
            {judges?.map((judge) => (
              <label key={judge.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedJudges.includes(judge.id)}
                  onChange={() => toggleSelection(judge.id, selectedJudges, setSelectedJudges)}
                  className="accent-accent"
                />
                <span>{judge.name}</span>
              </label>
            ))}
            {!judges?.length && <p className="text-xs text-zinc-500">No judges available.</p>}
          </div>
        </div>
        <div>
          <h3 className="text-xs uppercase text-zinc-500 mb-2">Questions</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
            {questions?.map((question) => (
              <label key={question.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedQuestions.includes(question.id)}
                  onChange={() => toggleSelection(question.id, selectedQuestions, setSelectedQuestions)}
                  className="accent-accent"
                />
                <span className="truncate" title={question.questionText}>
                  {question.questionText}
                </span>
              </label>
            ))}
            {!questions?.length && <p className="text-xs text-zinc-500">No questions available.</p>}
          </div>
        </div>
        <div>
          <h3 className="text-xs uppercase text-zinc-500 mb-2">Verdicts</h3>
          <div className="space-y-2">
            {["pass", "fail", "inconclusive"].map((verdict) => (
              <label key={verdict} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedVerdicts.includes(verdict)}
                  onChange={() => toggleSelection(verdict, selectedVerdicts, setSelectedVerdicts)}
                  className="accent-accent"
                />
                <span className="capitalize">{verdict}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {passRate && (
        <div className="border border-slate/60 rounded-lg p-4 bg-panel/40 text-sm">
          <p>
            Pass rate: <span className="text-green-400 font-semibold">{passRate.percent}%</span> (
            {passRate.passed} / {passRate.total} evaluations)
          </p>
        </div>
      )}

      <div className="border border-slate/60 rounded-lg overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-panel/80 text-zinc-400">
            <tr>
              <th className="px-4 py-2 text-left">Submission</th>
              <th className="px-4 py-2 text-left">Question</th>
              <th className="px-4 py-2 text-left">Judge</th>
              <th className="px-4 py-2 text-left">Verdict</th>
              <th className="px-4 py-2 text-left">Reasoning</th>
              <th className="px-4 py-2 text-left">Created</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-zinc-500">
                  Loading evaluations...
                </td>
              </tr>
            )}
            {!isLoading && (!evaluations || evaluations.length === 0) && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-zinc-500">
                  No evaluations yet. Run the AI judges to populate this view.
                </td>
              </tr>
            )}
            {evaluations?.map((evaluation) => (
              <tr key={evaluation.id} className="border-t border-slate/60">
                <td className="px-4 py-3 font-mono text-xs">{evaluation.submissionId}</td>
                <td className="px-4 py-3 max-w-xs">
                  <div className="text-sm">{evaluation.question.questionText}</div>
                </td>
                <td className="px-4 py-3">{evaluation.judge.name}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded text-xs uppercase tracking-wide ${
                      evaluation.verdict === "pass"
                        ? "bg-green-500/10 text-green-400"
                        : evaluation.verdict === "fail"
                        ? "bg-red-500/10 text-red-400"
                        : "bg-yellow-500/10 text-yellow-300"
                    }`}
                  >
                    {evaluation.verdict ?? "error"}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-zinc-300">
                  {evaluation.reasoning ?? evaluation.error ?? "No reasoning"}
                </td>
                <td className="px-4 py-3 text-xs text-zinc-500">
                  {new Date(evaluation.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default ResultsPage;

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../api/client";
import { Assignment, Judge, Question } from "../types";

const AssignPage = () => {
  const queryClient = useQueryClient();
  const { data: judges } = useQuery<Judge[]>({
    queryKey: ["judges"],
    queryFn: () => apiClient.get<Judge[]>("/api/judges")
  });

  const { data: questions } = useQuery<Question[]>({
    queryKey: ["questions"],
    queryFn: () => apiClient.get<Question[]>("/api/questions")
  });

  const { data: assignments, isLoading } = useQuery<Assignment[]>({
    queryKey: ["assignments"],
    queryFn: () => apiClient.get<Assignment[]>("/api/assignments")
  });

  const [selection, setSelection] = useState<Record<string, Set<number>>>({});
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!assignments) return;
    const grouped: Record<string, Set<number>> = {};
    for (const assignment of assignments) {
      grouped[assignment.questionId] = grouped[assignment.questionId] ?? new Set<number>();
      grouped[assignment.questionId].add(assignment.judgeId);
    }
    setSelection(grouped);
  }, [assignments]);

  const allQuestions = useMemo(() => questions ?? [], [questions]);
  const activeJudges = useMemo(() => (judges ?? []).filter((judge) => judge.active), [judges]);

  const saveMutation = useMutation({
    mutationFn: async (payload: Record<string, number[]>) => {
      const entries = Object.entries(payload);
      await Promise.all(
        entries.map(([questionId, judgeIds]) =>
          apiClient.put(`/api/assignments/${questionId}`, { judgeIds })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      setStatus("Assignments saved");
      setError(null);
    },
    onError: (mutationError) => {
      const message = mutationError instanceof Error ? mutationError.message : "Failed to save";
      setError(message);
    }
  });

  const handleToggle = (questionId: string, judgeId: number) => {
    setSelection((prev) => {
      const current = new Set(prev[questionId] ?? []);
      if (current.has(judgeId)) {
        current.delete(judgeId);
      } else {
        current.add(judgeId);
      }
      return { ...prev, [questionId]: current };
    });
  };

  const handleSave = () => {
    setStatus(null);
    setError(null);
    const payload = Object.fromEntries(
      Object.entries(selection).map(([questionId, judgeSet]) => [questionId, Array.from(judgeSet)])
    );
    saveMutation.mutate(payload);
  };

  return (
    <section className="space-y-8">
      <header>
        <h1 className="text-3xl font-semibold">Assignments</h1>
        <p className="text-sm text-zinc-400 mt-2">
          Choose which active judges evaluate each question template.
        </p>
      </header>

      {status && <div className="text-sm text-green-400">{status}</div>}
      {error && <div className="text-sm text-red-400">{error}</div>}

      <div className="flex justify-between items-center">
        <p className="text-xs text-zinc-500">
          Active judges only are shown. Toggle judges to include them in the next evaluation run.
        </p>
        <button
          onClick={handleSave}
          disabled={saveMutation.isPending}
          className="px-4 py-2 bg-accent/80 hover:bg-accent text-black rounded-md"
        >
          {saveMutation.isPending ? "Saving..." : "Save mappings"}
        </button>
      </div>

      <div className="grid gap-4">
        {isLoading && <p className="text-sm text-zinc-400">Loading assignments...</p>}
        {!isLoading && allQuestions.length === 0 && (
          <p className="text-sm text-zinc-500">No questions available. Import submissions first.</p>
        )}

        {allQuestions.map((question) => (
          <div
            key={question.id}
            className="border border-slate/60 rounded-lg p-5 bg-panel/40 space-y-4"
          >
            <div>
              <h3 className="text-lg font-semibold">{question.questionText}</h3>
              <p className="text-xs text-zinc-500">Type: {question.questionType}</p>
            </div>
            {activeJudges.length === 0 ? (
              <p className="text-sm text-zinc-500">Create an active judge to assign this question.</p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {activeJudges.map((judge) => {
                  const selected = selection[question.id]?.has(judge.id) ?? false;
                  return (
                    <label
                      key={judge.id}
                      className={`px-3 py-2 rounded border text-sm cursor-pointer transition ${
                        selected
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-slate/60 bg-background"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => handleToggle(question.id, judge.id)}
                        className="mr-2 accent-accent"
                      />
                      {judge.name}
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

export default AssignPage;

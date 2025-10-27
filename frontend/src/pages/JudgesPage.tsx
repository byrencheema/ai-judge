import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { apiClient } from "../api/client";
import { Judge } from "../types";

interface JudgeFormValues {
  name: string;
  prompt: string;
  model: string;
  active: boolean;
}

const OPENAI_MODELS = [
  {
    value: "gpt-5",
    label: "GPT-5"
  },
  {
    value: "gpt-5-mini",
    label: "GPT-5 mini"
  },
  {
    value: "gpt-5-nano",
    label: "GPT-5 nano"
  },
  {
    value: "gpt-4o",
    label: "GPT-4o"
  },
  {
    value: "gpt-4o-mini",
    label: "GPT-4o mini"
  }
];

const defaultValues: JudgeFormValues = {
  name: "",
  prompt: "",
  model: "gpt-5-mini",
  active: true
};

const JudgesPage = () => {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset } = useForm<JudgeFormValues>({ defaultValues });

  const { data: judges, isLoading, error } = useQuery<Judge[]>({
    queryKey: ["judges"],
    queryFn: () => apiClient.get<Judge[]>("/api/judges")
  });

  const createMutation = useMutation({
    mutationFn: (payload: JudgeFormValues) => apiClient.post<Judge>("/api/judges", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["judges"] });
      reset(defaultValues);
    }
  });

  const updateJudge = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<JudgeFormValues> }) =>
      apiClient.put<Judge>(`/api/judges/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["judges"] });
    }
  });

  const deleteJudge = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/api/judges/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["judges"] });
    }
  });

  const onSubmit = (values: JudgeFormValues) => {
    createMutation.mutate(values);
  };

  return (
    <section className="space-y-10">
      <header>
        <h1 className="text-3xl font-semibold">AI judges</h1>
        <p className="text-sm text-zinc-400 mt-2">Define prompts, select models, and toggle availability.</p>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-6 bg-panel/40 border border-slate/60 rounded-sm p-6">
        <div>
          <label className="block text-sm text-zinc-400 mb-1">Name</label>
          <input
            {...register("name", { required: true })}
            className="w-full bg-background border border-slate/60 rounded-none px-3 py-2 font-mono"
            placeholder="e.g., Strict Accuracy Judge"
          />
        </div>
        <div>
          <label className="block text-sm text-zinc-400 mb-1">Model</label>
          <select
            {...register("model", { required: true })}
            className="w-full bg-background border border-slate/60 rounded-none px-3 py-2 font-mono"
          >
            {OPENAI_MODELS.map((model) => (
              <option key={model.value} value={model.value}>
                {model.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-zinc-400 mb-1">Prompt / rubric</label>
          <textarea
            {...register("prompt", { required: true })}
            rows={5}
            className="w-full bg-background border border-slate/60 rounded-none px-3 py-2 font-mono text-sm"
            placeholder="e.g., Evaluate the answer for factual accuracy. Pass if the answer is scientifically correct and well-reasoned. Fail if it contains false information or poor reasoning."
          />
        </div>
        <div className="flex items-center gap-3">
          <input type="checkbox" {...register("active")} className="accent-accent" />
          <span className="text-sm text-zinc-300">Active</span>
        </div>
        <button
          type="submit"
          className="justify-self-start px-4 py-2 bg-accent hover:bg-accent/80 text-black rounded-none font-mono uppercase tracking-wider transition-all"
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? "Saving..." : "Create judge"}
        </button>
        {createMutation.isError && (
          <p className="text-sm text-red-400">Failed to create judge. Please review the form.</p>
        )}
        {createMutation.isSuccess && <p className="text-sm text-green-400">Judge saved.</p>}
      </form>

      <div>
        <h2 className="text-xl font-semibold mb-4">Existing judges</h2>
        {isLoading && <p className="text-sm text-zinc-400">Loading...</p>}
        {error && <p className="text-sm text-red-400">Failed to load judges.</p>}
        {judges && judges.length === 0 && <p className="text-sm text-zinc-500">No judges created yet.</p>}
        {judges && judges.length > 0 && (
          <div className="overflow-hidden border border-slate/60 rounded-none">
            <table className="min-w-full text-sm">
              <thead className="bg-panel/80 text-zinc-400">
                <tr>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Model</th>
                  <th className="px-4 py-2 text-left">Active</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {judges.map((judge) => (
                  <tr key={judge.id} className="border-t border-slate/60">
                    <td className="px-4 py-3">
                      <div className="font-medium">{judge.name}</div>
                      <p className="text-xs text-zinc-500 truncate max-w-xs">{judge.prompt}</p>
                    </td>
                    <td className="px-4 py-3">{judge.model}</td>
                    <td className="px-4 py-3">
                      <label className="inline-flex items-center gap-2 text-xs">
                        <input
                          type="checkbox"
                          checked={judge.active}
                          onChange={() =>
                            updateJudge.mutate({ id: judge.id, data: { active: !judge.active } })
                          }
                          className="accent-accent"
                        />
                        {judge.active ? "Active" : "Inactive"}
                      </label>
                    </td>
                    <td className="px-4 py-3 space-x-2">
                      <button
                        onClick={() => deleteJudge.mutate(judge.id)}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
};

export default JudgesPage;

import { useState, type ChangeEvent } from "react";
import { apiClient } from "../api/client";

type RawSubmission = {
  id: string;
  queueId: string;
  labelingTaskId: string;
  createdAt: number;
  questions: Array<{
    rev: number;
    data: {
      id: string;
      questionType: string;
      questionText: string;
    };
  }>;
  answers: Record<string, unknown>;
};

const UploadPage = () => {
  const [preview, setPreview] = useState<RawSubmission[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setStatus(null);
    const file = event.target.files?.[0];

    if (!file) {
      setPreview(null);
      return;
    }

    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as RawSubmission[];
      setPreview(parsed);
    } catch (parseError) {
      console.error(parseError);
      setError("Unable to parse file. Please ensure it matches the expected JSON format.");
    }
  };

  const handleUpload = async () => {
    if (!preview) return;
    setIsUploading(true);
    setError(null);
    setStatus(null);

    try {
      const response = await apiClient.post<{ message: string }>("/api/submissions/import", preview);
      setStatus(response.message);
      setPreview(null);
    } catch (uploadError) {
      const message = uploadError instanceof Error ? uploadError.message : "Upload failed";
      setError(message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <section className="space-y-8">
      <header>
        <h1 className="text-3xl font-semibold">Upload submissions</h1>
        <p className="text-sm text-zinc-400 mt-2">Import JSON data to seed the evaluation queue.</p>
      </header>

      <div className="border border-slate/60 border-dashed rounded-lg p-10 text-center bg-panel/40">
        <input
          type="file"
          accept="application/json"
          onChange={handleFileChange}
          className="block mx-auto"
        />
        <p className="mt-4 text-sm text-zinc-400">Drop a JSON file exported from the annotation platform.</p>
      </div>

      {error && <div className="rounded bg-red-500/10 border border-red-500/40 p-4 text-sm text-red-300">{error}</div>}
      {status && <div className="rounded bg-green-500/10 border border-green-500/40 p-4 text-sm text-green-300">{status}</div>}

      {preview && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Preview ({preview.length} submissions)</h2>
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="px-4 py-2 bg-accent/80 hover:bg-accent text-black rounded-md disabled:opacity-50"
            >
              {isUploading ? "Importing..." : "Save to database"}
            </button>
          </div>
          <div className="overflow-hidden border border-slate/60 rounded-lg">
            <table className="min-w-full text-sm">
              <thead className="bg-panel/80 text-zinc-400">
                <tr>
                  <th className="px-4 py-2 text-left">Submission</th>
                  <th className="px-4 py-2 text-left">Queue</th>
                  <th className="px-4 py-2 text-left">Questions</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((submission) => (
                  <tr key={submission.id} className="border-t border-slate/60">
                    <td className="px-4 py-2 font-mono">{submission.id}</td>
                    <td className="px-4 py-2">{submission.queueId}</td>
                    <td className="px-4 py-2">{submission.questions.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
};

export default UploadPage;

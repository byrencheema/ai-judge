export type Verdict = "pass" | "fail" | "inconclusive";

export interface Question {
  id: string;
  questionType: string;
  questionText: string;
}

export interface Answer {
  id: number;
  submissionId: string;
  questionId: string;
  choice?: string | null;
  reasoning?: string | null;
  text?: string | null;
  question?: Question;
}

export interface Submission {
  id: string;
  queueId: string;
  labelingTaskId: string;
  createdAt: string;
  answers: Answer[];
}

export interface Judge {
  id: number;
  name: string;
  prompt: string;
  model: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Assignment {
  id: number;
  questionId: string;
  judgeId: number;
  judge?: Judge;
  question?: Question;
}

export interface Evaluation {
  id: number;
  submissionId: string;
  questionId: string;
  judgeId: number;
  verdict: Verdict | null;
  reasoning: string | null;
  status: string;
  error?: string | null;
  createdAt: string;
  judge: Judge;
  question: Question;
  submission: Submission;
}

export interface EvaluationRunSummary {
  planned: number;
  completed: number;
  failed: number;
  createdEvaluationIds: number[];
}

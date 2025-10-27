import express from "express";
import { z } from "zod";
import OpenAI from "openai";
import { prisma } from "../prisma";
import { BASE_SYSTEM_PROMPT, buildJudgePrompt } from "../utils/evaluation";

const EvaluationResultSchema = z.object({
  verdict: z.string(),
  reasoning: z.string().min(1)
});

const router = express.Router();

const EvaluateSchema = z.object({
  queueId: z.string().optional()
});

const FilterSchema = z.object({
  judgeIds: z
    .string()
    .optional()
    .transform((value) => value?.split(",").filter(Boolean).map((id) => Number(id)) ?? []),
  questionIds: z
    .string()
    .optional()
    .transform((value) => value?.split(",").filter(Boolean) ?? []),
  verdicts: z
    .string()
    .optional()
    .transform((value) => value?.split(",").filter(Boolean) ?? [])
});

router.get("/evaluations", async (req, res) => {
  const parseResult = FilterSchema.safeParse(req.query);

  if (!parseResult.success) {
    return res.status(400).json({ message: "Invalid filters", issues: parseResult.error.issues });
  }

  const { judgeIds, questionIds, verdicts } = parseResult.data;

  const evaluations = await prisma.evaluation.findMany({
    where: {
      judgeId: judgeIds.length ? { in: judgeIds } : undefined,
      questionId: questionIds.length ? { in: questionIds } : undefined,
      verdict: verdicts.length ? { in: verdicts } : undefined
    },
    include: {
      judge: true,
      question: true,
      submission: true
    },
    orderBy: { createdAt: "desc" }
  });

  res.json(evaluations);
});

router.delete("/evaluations", async (_req, res) => {
  const result = await prisma.evaluation.deleteMany({});
  res.json({ message: `Deleted ${result.count} evaluations` });
});

router.post("/evaluate", async (req, res) => {
  const parseResult = EvaluateSchema.safeParse(req.body ?? {});

  if (!parseResult.success) {
    return res.status(400).json({ message: "Invalid evaluate payload", issues: parseResult.error.issues });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ message: "OPENAI_API_KEY is not configured" });
  }

  const { queueId } = parseResult.data;

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const submissions = await prisma.submission.findMany({
    where: queueId ? { queueId } : undefined,
    include: {
      answers: true
    }
  });

  const assignments = await prisma.assignment.findMany({
    include: { judge: true }
  });

  const questions = await prisma.question.findMany();

  const questionById = questions.reduce<Record<string, (typeof questions)[number]>>((acc, question) => {
    acc[question.id] = question;
    return acc;
  }, {});

  const assignmentsByQuestion = assignments.reduce<Record<string, typeof assignments>>((acc, assignment) => {
    acc[assignment.questionId] = acc[assignment.questionId] ?? [];
    acc[assignment.questionId].push(assignment);
    return acc;
  }, {});

  const planned = submissions.reduce((count, submission) => {
    return (
      count +
      submission.answers.reduce((answerCount, answer) => {
        const judges = (assignmentsByQuestion[answer.questionId] ?? []).filter((assignment) => assignment.judge.active);
        return answerCount + judges.length;
      }, 0)
    );
  }, 0);

  const tasks: Array<Promise<void>> = [];
  let completed = 0;
  let failed = 0;

  const evaluationsCreated: number[] = [];

  for (const submission of submissions) {
    for (const answer of submission.answers) {
      const judges = assignmentsByQuestion[answer.questionId] ?? [];

      if (judges.length === 0) continue;

      const question = questionById[answer.questionId];

      if (!question) continue;

      for (const assignment of judges) {
        const { judge } = assignment;

        if (!judge.active) continue;

        const task = (async () => {
          try {
            // Format answer based on question type
            let answerText = "(no answer provided)";

            if (question.questionType === "single_choice_with_reasoning") {
              // For single_choice_with_reasoning, combine choice and reasoning
              if (answer.choice && answer.reasoning) {
                answerText = `${answer.choice} - ${answer.reasoning}`;
              } else if (answer.choice) {
                answerText = answer.choice;
              } else if (answer.reasoning) {
                answerText = answer.reasoning;
              }
            } else {
              // For other question types, use text, reasoning, or choice in order
              answerText = answer.text ?? answer.reasoning ?? answer.choice ?? "(no answer provided)";
            }

            const prompt = buildJudgePrompt({
              questionText: question.questionText,
              answer: answerText,
              judgePrompt: judge.prompt
            });

            const response = await openai.chat.completions.create({
              model: judge.model,
              messages: [
                { role: "system", content: BASE_SYSTEM_PROMPT },
                {
                  role: "user",
                  content: prompt
                }
              ],
              response_format: { type: "json_object" }
            });

            const content = response.choices[0]?.message?.content;
            if (!content) {
              throw new Error("No response content from model");
            }

            const parsed = EvaluationResultSchema.parse(JSON.parse(content));
            const verdict = parsed.verdict.toLowerCase();
            if (!["pass", "fail", "inconclusive"].includes(verdict)) {
              throw new Error(`Unexpected verdict: ${parsed.verdict}`);
            }

            const evaluation = await prisma.evaluation.create({
              data: {
                submissionId: submission.id,
                questionId: question.id,
                judgeId: judge.id,
                verdict,
                reasoning: parsed.reasoning,
                status: "completed"
              }
            });

            evaluationsCreated.push(evaluation.id);
            completed += 1;
          } catch (error) {
            failed += 1;
            const message = error instanceof Error ? error.message : "Unknown error";

            await prisma.evaluation.create({
              data: {
                submissionId: submission.id,
                questionId: question.id,
                judgeId: judge.id,
                verdict: null,
                reasoning: null,
                status: "failed",
                error: message
              }
            });
          }
        })();

        tasks.push(task);
      }
    }
  }

  await Promise.allSettled(tasks);

  // Fetch all created evaluations to return their verdicts
  const evaluations = await prisma.evaluation.findMany({
    where: {
      id: { in: evaluationsCreated }
    },
    select: {
      id: true,
      verdict: true,
      status: true
    }
  });

  res.json({
    planned,
    completed,
    failed,
    createdEvaluationIds: evaluationsCreated,
    evaluations
  });
});

export default router;

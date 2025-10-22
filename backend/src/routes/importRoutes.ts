import type { Request, Response } from "express";
import express from "express";
import { z } from "zod";
import { prisma } from "../prisma";

const SubmissionQuestionSchema = z.object({
  rev: z.number(),
  data: z.object({
    id: z.string(),
    questionType: z.string(),
    questionText: z.string()
  })
});

const SubmissionSchema = z.object({
  id: z.string(),
  queueId: z.string(),
  labelingTaskId: z.string(),
  createdAt: z.number(),
  questions: z.array(SubmissionQuestionSchema),
  answers: z.record(
    z.string(),
    z.object({
      choice: z.string().optional(),
      reasoning: z.string().optional(),
      freeform: z.string().optional(),
      text: z.string().optional()
    })
  )
});

const ImportPayloadSchema = z.array(SubmissionSchema);

const router = express.Router();

router.post("/submissions/import", async (req: Request, res: Response) => {
  const parseResult = ImportPayloadSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({
      message: "Invalid submission payload",
      issues: parseResult.error.issues
    });
  }

  const submissions = parseResult.data;

  await prisma.$transaction(async (tx) => {
    for (const submission of submissions) {
      await tx.submission.upsert({
        where: { id: submission.id },
        update: {
          queueId: submission.queueId,
          labelingTaskId: submission.labelingTaskId,
          createdAt: new Date(submission.createdAt)
        },
        create: {
          id: submission.id,
          queueId: submission.queueId,
          labelingTaskId: submission.labelingTaskId,
          createdAt: new Date(submission.createdAt)
        }
      });

      for (const question of submission.questions) {
        await tx.question.upsert({
          where: { id: question.data.id },
          update: {
            questionText: question.data.questionText,
            questionType: question.data.questionType
          },
          create: {
            id: question.data.id,
            questionText: question.data.questionText,
            questionType: question.data.questionType
          }
        });

        const answer = submission.answers[question.data.id];

        if (answer) {
          await tx.answer.upsert({
            where: {
              submissionId_questionId: {
                submissionId: submission.id,
                questionId: question.data.id
              }
            },
            update: {
              choice: answer.choice ?? null,
              reasoning: answer.reasoning ?? null,
              text: answer.text ?? answer.freeform ?? null
            },
            create: {
              submissionId: submission.id,
              questionId: question.data.id,
              choice: answer.choice ?? null,
              reasoning: answer.reasoning ?? null,
              text: answer.text ?? answer.freeform ?? null
            }
          });
        }
      }
    }
  });

  res.json({
    count: submissions.length,
    message: `Imported ${submissions.length} submissions`
  });
});

export default router;

import express from "express";
import { z } from "zod";
import { prisma } from "../prisma";

const router = express.Router();

const AssignmentUpdateSchema = z.object({
  judgeIds: z.array(z.number()).default([])
});

const BulkAssignmentSchema = z.object({
  assignments: z.array(
    z.object({
      judgeId: z.number(),
      questionId: z.string()
    })
  )
});

router.get("/assignments", async (_req, res) => {
  const assignments = await prisma.assignment.findMany({
    include: {
      judge: true,
      question: true
    }
  });

  res.json(assignments);
});

router.put("/assignments/:questionId", async (req, res) => {
  const parseResult = AssignmentUpdateSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({ message: "Invalid payload", issues: parseResult.error.issues });
  }

  const { judgeIds } = parseResult.data;
  const questionId = req.params.questionId;

  await prisma.$transaction(async (tx) => {
    await tx.assignment.deleteMany({ where: { questionId } });

    if (judgeIds.length > 0) {
      await tx.assignment.createMany({
        data: judgeIds.map((judgeId) => ({ questionId, judgeId }))
      });
    }
  });

  const updated = await prisma.assignment.findMany({
    where: { questionId },
    include: { judge: true }
  });

  res.json(updated);
});

router.post("/assignments/bulk", async (req, res) => {
  const parseResult = BulkAssignmentSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({ message: "Invalid payload", issues: parseResult.error.issues });
  }

  const { assignments } = parseResult.data;

  await prisma.$transaction(async (tx) => {
    // Delete all existing assignments
    await tx.assignment.deleteMany({});

    // Create new assignments from the workflow connections
    if (assignments.length > 0) {
      await tx.assignment.createMany({
        data: assignments.map(({ judgeId, questionId }) => ({ judgeId, questionId }))
      });
    }
  });

  const updated = await prisma.assignment.findMany({
    include: { judge: true, question: true }
  });

  res.json(updated);
});

export default router;

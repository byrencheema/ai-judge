import express from "express";
import { prisma } from "../prisma";

const router = express.Router();

router.get("/submissions", async (_req, res) => {
  const submissions = await prisma.submission.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      answers: {
        include: {
          question: true
        }
      }
    }
  });

  res.json(submissions);
});

router.get("/queues", async (_req, res) => {
  const submissions = await prisma.submission.findMany({
    select: { queueId: true },
    distinct: ["queueId"]
  });

  res.json(submissions.map((s) => s.queueId));
});

export default router;

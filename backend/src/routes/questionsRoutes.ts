import express from "express";
import { prisma } from "../prisma";

const router = express.Router();

router.get("/questions", async (_req, res) => {
  const questions = await prisma.question.findMany({
    orderBy: { questionText: "asc" }
  });

  res.json(questions);
});

export default router;

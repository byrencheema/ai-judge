import express from "express";
import { z } from "zod";
import { prisma } from "../prisma";

const router = express.Router();

const JudgeSchema = z.object({
  name: z.string().min(1),
  prompt: z.string().min(1),
  model: z.string().min(1),
  active: z.boolean().default(true)
});

router.get("/judges", async (_req, res) => {
  const judges = await prisma.judge.findMany({
    orderBy: { createdAt: "desc" }
  });

  res.json(judges);
});

router.post("/judges", async (req, res) => {
  const parseResult = JudgeSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({ message: "Invalid judge payload", issues: parseResult.error.issues });
  }

  const judge = await prisma.judge.create({ data: parseResult.data });
  res.status(201).json(judge);
});

router.put("/judges/:id", async (req, res) => {
  const id = Number(req.params.id);

  if (Number.isNaN(id)) {
    return res.status(400).json({ message: "Invalid judge id" });
  }

  const parseResult = JudgeSchema.partial({ active: true }).safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({ message: "Invalid judge payload", issues: parseResult.error.issues });
  }

  const judge = await prisma.judge.update({ where: { id }, data: parseResult.data });
  res.json(judge);
});

router.delete("/judges/:id", async (req, res) => {
  const id = Number(req.params.id);

  if (Number.isNaN(id)) {
    return res.status(400).json({ message: "Invalid judge id" });
  }

  await prisma.judge.delete({ where: { id } });
  res.status(204).send();
});

export default router;

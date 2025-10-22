import cors from "cors";
import express from "express";
import morgan from "morgan";
import importRoutes from "./routes/importRoutes";
import judgesRoutes from "./routes/judgesRoutes";
import submissionsRoutes from "./routes/submissionsRoutes";
import assignmentsRoutes from "./routes/assignmentsRoutes";
import evaluationsRoutes from "./routes/evaluationsRoutes";
import questionsRoutes from "./routes/questionsRoutes";

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 4000;

app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api", importRoutes);
app.use("/api", judgesRoutes);
app.use("/api", submissionsRoutes);
app.use("/api", assignmentsRoutes);
app.use("/api", evaluationsRoutes);
app.use("/api", questionsRoutes);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ message: "Unexpected server error" });
});

app.listen(port, () => {
  console.log(`API server listening on http://localhost:${port}`);
});

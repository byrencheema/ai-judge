# Judge

Judge is a Palantir-inspired AI evaluation console that imports human annotation data, runs configurable AI "judges" against each answer, and surfaces verdicts with reasoning and pass-rate analytics.

## Features

- 📥 **Data ingestion** – Upload the provided JSON export and persist submissions, questions, and answers in SQLite via Prisma.
- 🧑‍⚖️ **Judge management** – Create, edit, activate, or delete AI judges with custom prompts and target models.
- 🔗 **Assignments** – Map one or more judges to each question template and persist the configuration.
- ⚙️ **Evaluation runner** – Trigger asynchronous LLM calls (OpenAI GPT-4o-mini by default) per (submission × question × judge) pair, with error capture and summary stats.
- 📊 **Results explorer** – Filterable verdict table with aggregate pass rate and contextual metadata for each evaluation.

## Tech stack

| Layer      | Choice                        |
| ---------- | ----------------------------- |
| Frontend   | React 18 + TypeScript + Vite  |
| Styling    | Tailwind CSS + custom tokens  |
| State/data | TanStack Query, React Hook Form |
| Backend    | Express + TypeScript          |
| Database   | SQLite (Prisma ORM)           |
| LLM        | OpenAI `gpt-4o-mini` (configurable per judge) |

## Getting started

1. **Install dependencies**

   ```bash
   npm install
   ```

   This workspace uses npm workspaces; the command above installs the root dependencies plus the `frontend` and `backend` packages.

2. **Configure environment**

   ```bash
   cp .env.example .env
   # Edit .env and add your OpenAI API key
   ```

3. **Generate the Prisma client and database schema**

   ```bash
   npm run generate --workspace backend
   npm run db:push --workspace backend
   ```

4. **Start the development servers**

   ```bash
   npm run dev
   ```

   The root `dev` script launches both the Express API (http://localhost:4000) and the Vite app (http://localhost:5173) with a proxy for `/api` requests.

## Usage walkthrough

1. **Upload data** – Drag the provided `sample_input.json` (or the production grading file) into the Upload page and save it to SQLite.
2. **Create judges** – Define at least one judge with a rubric and target OpenAI model. Toggle inactive judges off to remove them from runs without deleting them.
3. **Assign judges** – Map active judges to each question template. Each toggle persists on save.
4. **Run evaluations** – Choose a specific queue or run against all queues. The backend parallelises LLM calls with graceful failure handling and stores each verdict.
5. **Review results** – Filter by judge, question, or verdict type and inspect reasoning text along with aggregate pass rates.

## API overview

All backend endpoints are prefixed with `/api`:

- `POST /api/submissions/import` – Bulk import submissions from JSON.
- `GET /api/submissions` – List submissions with answers.
- `GET /api/queues` – List distinct queue IDs.
- `GET /api/questions` – List question templates.
- `GET /api/judges` / `POST /api/judges` / `PUT /api/judges/:id` / `DELETE /api/judges/:id` – Manage judges.
- `GET /api/assignments` / `PUT /api/assignments/:questionId` – Manage judge-question mappings.
- `POST /api/evaluate` – Run configured judges across submissions (optionally filtered by `queueId`).
- `GET /api/evaluations` – Fetch evaluations with optional `judgeIds`, `questionIds`, and `verdicts` query parameters.

## Testing & linting

- Frontend linting: `npm run lint`
- Backend build check: `npm run build --workspace backend`

(You can also run individual workspace commands with `npm run <script> --workspace <name>`.)

## Trade-offs & notes

- The assignment UI uses responsive pill toggles instead of a full canvas-based graph to prioritise clarity and speed of implementation.
- Evaluation runs rely on OpenAI's `chat.completions` API with JSON mode; swap the `model` field per judge to target Anthropic or Gemini via a thin integration layer.
- Erroring evaluations are persisted with `status = "failed"` so the results table exposes operational issues alongside successful verdicts.

## Sample data

A minimal `sample_input.json` is included in the challenge brief. Use it to verify ingestion and assignment flows before running the full evaluation set.

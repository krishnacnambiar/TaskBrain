import Fastify, { FastifyReply, FastifyRequest } from "fastify";
import cors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { computeScore, deriveStatus } from "./scoring.js";
import { insertTask, getTasks, getTask, updateTask } from "./db.js";
import { ingestSchema, patchSchema } from "./validation.js";
import { Task, Status } from "./types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: (origin, cb) => {
    if (!origin) {
      cb(null, true);
      return;
    }
    if (
      origin.startsWith("chrome-extension://") ||
      origin.startsWith("http://localhost") ||
      origin.startsWith("http://127.0.0.1") ||
      origin.startsWith("http://192.168.") ||
      origin.startsWith("http://0.0.0.0") ||
      origin.startsWith("https://localhost")
    ) {
      cb(null, true);
      return;
    }
    cb(new Error("Origin not allowed"), false);
  },
  allowedHeaders: ["Content-Type", "x-taskbrain-token"],
});

const publicDir = path.resolve(__dirname, "../src/public");
await app.register(fastifyStatic, {
  root: publicDir,
});

const requireAuth = async (request: FastifyRequest, reply: FastifyReply) => {
  const expected = process.env.TASKBRAIN_TOKEN;
  if (!expected) {
    return reply.code(500).send({ message: "TASKBRAIN_TOKEN not configured" });
  }
  const provided = request.headers["x-taskbrain-token"];
  if (!provided || provided !== expected) {
    return reply.code(401).send({ message: "Unauthorized" });
  }
};

app.get("/health", { preHandler: requireAuth }, async () => ({ status: "ok" }));

app.post("/ingest", { preHandler: requireAuth }, async (request, reply) => {
  const parseResult = ingestSchema.safeParse(request.body);
  if (!parseResult.success) {
    reply.code(400).send({ message: "Invalid payload", errors: parseResult.error.flatten() });
    return;
  }
  const payload = parseResult.data;

  const score = computeScore({
    dueAt: payload.dueAt ?? undefined,
    criticality: payload.criticality,
    effort: payload.effort,
  });

  let status: Status = deriveStatus(score);
  if (!payload.dueAt && (payload.criticality === "P2" || payload.criticality === "P3")) {
    status = "inbox";
  }

  const now = new Date().toISOString();
  const task: Task = {
    id: randomUUID(),
    createdAt: now,
    updatedAt: now,
    source: "browser",
    title: payload.title,
    url: payload.url,
    selection: payload.selection ?? null,
    notes: payload.notes ?? null,
    workstream: payload.workstream,
    dueAt: payload.dueAt ?? null,
    criticality: payload.criticality,
    effort: payload.effort,
    status,
    score,
  };

  insertTask(task);
  reply.code(201).send(task);
});

app.get("/tasks", { preHandler: requireAuth }, async (_request, _reply) => {
  return getTasks();
});

app.get("/tasks/:id", { preHandler: requireAuth }, async (request, reply) => {
  const { id } = request.params as { id: string };
  const task = getTask(id);
  if (!task) {
    reply.code(404).send({ message: "Task not found" });
    return;
  }
  return task;
});

app.patch("/tasks/:id", { preHandler: requireAuth }, async (request, reply) => {
  const { id } = request.params as { id: string };
  const parseResult = patchSchema.safeParse(request.body);
  if (!parseResult.success) {
    reply.code(400).send({ message: "Invalid payload", errors: parseResult.error.flatten() });
    return;
  }
  const payload = parseResult.data;
  const existing = getTask(id);
  if (!existing) {
    reply.code(404).send({ message: "Task not found" });
    return;
  }

  const merged = { ...existing, ...payload } as Task;
  merged.score = computeScore({
    dueAt: merged.dueAt ?? undefined,
    criticality: merged.criticality,
    effort: merged.effort,
  });

  if (payload.status) {
    merged.status = payload.status;
  } else if (!merged.dueAt && (merged.criticality === "P2" || merged.criticality === "P3")) {
    merged.status = "inbox";
  }

  merged.updatedAt = new Date().toISOString();
  const updated = updateTask(id, merged);
  if (!updated) {
    reply.code(500).send({ message: "Failed to update task" });
    return;
  }
  return updated;
});

const start = async () => {
  try {
    const port = Number(process.env.PORT || 8787);
    await app.listen({ port, host: "0.0.0.0" });
    app.log.info(`Task Brain server running on http://0.0.0.0:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();

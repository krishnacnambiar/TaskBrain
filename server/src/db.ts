import Database from "better-sqlite3";
import { Task } from "./types.js";
import path from "node:path";
import fs from "node:fs";

const dataDir = path.join(process.cwd(), "data");
const dbPath = path.join(dataDir, "taskbrain.db");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export const db = new Database(dbPath);

const createTable = `
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  source TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  selection TEXT,
  notes TEXT,
  workstream TEXT NOT NULL,
  dueAt TEXT,
  criticality TEXT NOT NULL,
  effort TEXT NOT NULL,
  status TEXT NOT NULL,
  score INTEGER NOT NULL
);
`;

db.exec(createTable);

export function insertTask(task: Task): void {
  const stmt = db.prepare(`
    INSERT INTO tasks (
      id, createdAt, updatedAt, source, title, url, selection, notes, workstream, dueAt, criticality, effort, status, score
    ) VALUES (@id, @createdAt, @updatedAt, @source, @title, @url, @selection, @notes, @workstream, @dueAt, @criticality, @effort, @status, @score)
  `);
  stmt.run(task);
}

export function getTasks(): Task[] {
  const stmt = db.prepare(`
    SELECT * FROM tasks ORDER BY datetime(createdAt) DESC
  `);
  return stmt.all();
}

export function getTask(id: string): Task | undefined {
  const stmt = db.prepare(`SELECT * FROM tasks WHERE id = ?`);
  return stmt.get(id);
}

export function updateTask(id: string, updates: Partial<Task>): Task | undefined {
  const existing = getTask(id);
  if (!existing) return undefined;
  const merged: Task = { ...existing, ...updates } as Task;
  const stmt = db.prepare(`
    UPDATE tasks SET
      createdAt = @createdAt,
      updatedAt = @updatedAt,
      source = @source,
      title = @title,
      url = @url,
      selection = @selection,
      notes = @notes,
      workstream = @workstream,
      dueAt = @dueAt,
      criticality = @criticality,
      effort = @effort,
      status = @status,
      score = @score
    WHERE id = @id
  `);
  stmt.run(merged);
  return merged;
}

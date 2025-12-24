import { z } from "zod";
import { Criticality, Effort, Status, Workstream } from "./types.js";

export const ingestSchema = z.object({
  title: z.string().min(1, "title is required"),
  url: z.string().url("url must be valid"),
  selection: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  workstream: z.enum(["FGL", "Freelance", "Personal", "Unknown" satisfies Workstream]),
  dueAt: z
    .string()
    .datetime({ message: "dueAt must be ISO datetime" })
    .optional()
    .nullable(),
  criticality: z.enum(["P0", "P1", "P2", "P3" satisfies Criticality]),
  effort: z.enum(["S", "M", "L", "XL" satisfies Effort]),
});

export const patchSchema = z
  .object({
    title: z.string().min(1).optional(),
    url: z.string().url().optional(),
    selection: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    workstream: z.enum(["FGL", "Freelance", "Personal", "Unknown" satisfies Workstream]).optional(),
    dueAt: z
      .string()
      .datetime({ message: "dueAt must be ISO datetime" })
      .optional()
      .nullable(),
    criticality: z.enum(["P0", "P1", "P2", "P3" satisfies Criticality]).optional(),
    effort: z.enum(["S", "M", "L", "XL" satisfies Effort]).optional(),
    status: z.enum(["inbox", "today", "next", "backlog", "done", "blocked" satisfies Status]).optional(),
  })
  .strict();

export type Workstream = "FGL" | "Freelance" | "Personal" | "Unknown";
export type Criticality = "P0" | "P1" | "P2" | "P3";
export type Effort = "S" | "M" | "L" | "XL";
export type Status = "inbox" | "today" | "next" | "backlog" | "done" | "blocked";

export interface Task {
  id: string;
  createdAt: string;
  updatedAt: string;
  source: "browser";
  title: string;
  url: string;
  selection?: string | null;
  notes?: string | null;
  workstream: Workstream;
  dueAt?: string | null;
  criticality: Criticality;
  effort: Effort;
  status: Status;
  score: number;
}

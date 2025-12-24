import { Criticality, Effort } from "./types.js";

const DAY_MS = 24 * 60 * 60 * 1000;

export function computeScore(options: {
  dueAt?: string | null;
  criticality: Criticality;
  effort: Effort;
}): number {
  const { dueAt, criticality, effort } = options;
  let score = 0;

  // Deadline proximity
  if (dueAt) {
    const dueDate = new Date(dueAt);
    const now = new Date();
    const diffMs = dueDate.getTime() - now.getTime();
    const diffDays = diffMs / DAY_MS;

    if (diffDays <= 1) {
      score += 50;
    } else if (diffDays <= 3) {
      score += 35;
    } else if (diffDays <= 7) {
      score += 20;
    } else {
      score += 10;
    }
  } else {
    score += 5;
  }

  // Criticality
  const criticalityScore: Record<Criticality, number> = {
    P0: 30,
    P1: 20,
    P2: 10,
    P3: 3,
  };
  score += criticalityScore[criticality];

  // Effort penalty
  const effortPenalty: Record<Effort, number> = {
    S: 5,
    M: 0,
    L: -5,
    XL: -10,
  };
  score += effortPenalty[effort];

  return score;
}

export function deriveStatus(score: number): "today" | "next" | "backlog" {
  if (score >= 80) return "today";
  if (score >= 60) return "next";
  if (score >= 40) return "backlog";
  return "backlog";
}

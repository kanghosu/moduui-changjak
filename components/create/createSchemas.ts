import { z } from "zod";
import type { ApiResult } from "@/components/BenchmarkResult";
import { MAX_QUESTIONS, normalizeElements, type ExtractedElements } from "@/engine/creation";

const QUESTION_ELEMENT_KEYS = [
  "scene",
  "heroDesc",
  "heroName",
  "heroWant",
  "heroNeed",
  "premise",
  "theme",
  "ending",
  "genre",
  "tone",
  "era",
  "benchmark",
  "choice",
  "hook",
] as const;

const CreationQuestionSchema = z.object({
  id: z.string(),
  elementKey: z.enum(QUESTION_ELEMENT_KEYS),
  ask: z.string(),
  hint: z.string().optional(),
  priority: z.union([z.literal(1), z.literal(2), z.literal(3)]),
});

const ExtractedElementSchema = z.object({
  value: z.string(),
  evidence: z.string().optional(),
  confidence: z.enum(["high", "low"]),
  unknown: z.boolean().optional(),
  source: z.enum(["user", "extracted"]).optional(),
});

export const ExtractResponseSchema = z.object({
  elements: z.record(z.string(), z.union([z.string(), ExtractedElementSchema])),
  questions: z.array(CreationQuestionSchema).max(MAX_QUESTIONS),
});

export const LoglineResponseSchema = z.object({
  options: z.array(z.object({
    logline: z.string(),
    premise: z.string(),
    direction: z.string(),
    benchmarkTitle: z.string(),
    reason: z.string(),
  })).min(3).max(3),
});

export const LibraryResponseSchema = z.object({
  list: z.array(z.object({
    title: z.string(),
    posterUrl: z.string().nullable().optional(),
  })),
});

export type LibraryItem = z.infer<typeof LibraryResponseSchema>["list"][number];

export function apiMessage(payload: unknown, fallback: string): string {
  if (typeof payload === "object" && payload !== null && "error" in payload && typeof payload.error === "string") {
    return payload.error;
  }
  return fallback;
}

export function isApiResult(payload: unknown): payload is ApiResult {
  return typeof payload === "object"
    && payload !== null
    && "engine" in payload
    && typeof payload.engine === "string";
}

export function toExtractedElements(values: unknown): ExtractedElements {
  return normalizeElements(values);
}

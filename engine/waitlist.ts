import { appendFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";

import type { Lang } from "../lib/i18n.ts";

export type WaitlistType = "waitlist" | "contact";

export type WaitlistEntry = {
  readonly email: string;
  readonly name: string;
  readonly message: string;
  readonly type: WaitlistType;
  readonly lang: Lang;
};

export interface WaitlistStore {
  add(entry: WaitlistEntry): Promise<"added" | "duplicate">;
}

export type WaitlistEnvironment = Readonly<Record<string, string | undefined>>;

type NodeFileError = Error & { readonly code?: string };

class WaitlistStoreError extends Error {
  readonly name = "WaitlistStoreError";
  readonly operation: string;
  readonly status: number;

  constructor(operation: string, status: number) {
    super(`Waitlist store ${operation} failed (${status}).`);
    this.operation = operation;
    this.status = status;
  }
}

function isNodeFileError(error: unknown): error is NodeFileError {
  return error instanceof Error && "code" in error && (typeof error.code === "string" || error.code === undefined);
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

async function readEntries(filePath: string): Promise<readonly string[]> {
  try {
    const content = await readFile(filePath, "utf8");
    return content.split(/\r?\n/).filter((line) => line.trim() !== "");
  } catch (error) {
    if (isNodeFileError(error) && error.code === "ENOENT") return [];
    throw error;
  }
}

function containsEmail(lines: readonly string[], email: string): boolean {
  return lines.some((line) => {
    try {
      const parsed: unknown = JSON.parse(line);
      return isRecord(parsed) && typeof parsed.email === "string" && normalizeEmail(parsed.email) === email;
    } catch (error) {
      if (error instanceof SyntaxError) return false;
      throw error;
    }
  });
}

type StoredEntry = WaitlistEntry & { readonly at: string };

class JsonlWaitlistStore implements WaitlistStore {
  private readonly filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  async add(entry: WaitlistEntry): Promise<"added" | "duplicate"> {
    const normalizedEntry = { ...entry, email: normalizeEmail(entry.email) };
    const lines = await readEntries(this.filePath);
    if (containsEmail(lines, normalizedEntry.email)) return "duplicate";

    await mkdir(path.dirname(this.filePath), { recursive: true });
    const storedEntry: StoredEntry = { ...normalizedEntry, at: new Date().toISOString() };
    await appendFile(this.filePath, `${JSON.stringify(storedEntry)}\n`, "utf8");
    return "added";
  }
}

function kvResult(payload: unknown): number {
  if (typeof payload === "number" && Number.isFinite(payload)) return payload;
  if (typeof payload === "string" && payload.trim() !== "") {
    const parsed = Number(payload);
    if (Number.isFinite(parsed)) return parsed;
  }
  if (isRecord(payload) && "result" in payload) return kvResult(payload.result);
  throw new WaitlistStoreError("parse", 502);
}

class KvWaitlistStore implements WaitlistStore {
  private readonly url: string;
  private readonly token: string;

  constructor(url: string, token: string) {
    this.url = url;
    this.token = token;
  }

  private async command(command: readonly unknown[]): Promise<unknown> {
    const response = await fetch(this.url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(command),
    });
    if (!response.ok) throw new WaitlistStoreError("request", response.status);
    return response.json();
  }

  async add(entry: WaitlistEntry): Promise<"added" | "duplicate"> {
    const normalizedEmail = normalizeEmail(entry.email);
    const added = await this.command(["SADD", "waitlist:emails", normalizedEmail]);
    if (kvResult(added) === 0) return "duplicate";

    const at = new Date().toISOString();
    await this.command([
      "HSET",
      `waitlist:entry:${normalizedEmail}`,
      "name",
      entry.name,
      "message",
      entry.message,
      "type",
      entry.type,
      "lang",
      entry.lang,
      "at",
      at,
    ]);
    return "added";
  }
}

function notificationText(entry: WaitlistEntry): string {
  const name = entry.name ? `\nName: ${entry.name}` : "";
  const message = entry.message ? `\nMessage: ${entry.message}` : "";
  return `[Modu Story] ${entry.type}: ${entry.email}${name}${message}`;
}

async function notify(webhook: string, entry: WaitlistEntry): Promise<void> {
  try {
    const response = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: notificationText(entry) }),
    });
    if (!response.ok) console.error(`Waitlist notification failed (${response.status}).`);
  } catch (error) {
    console.error("Waitlist notification failed.", error instanceof Error ? error.message : "unknown error");
  }
}

function withNotification(store: WaitlistStore, webhook: string | undefined): WaitlistStore {
  if (!webhook) return store;
  return {
    async add(entry) {
      const result = await store.add(entry);
      if (result === "added") await notify(webhook, entry);
      return result;
    },
  };
}

export function createJsonlWaitlistStore(filePath: string): WaitlistStore {
  return new JsonlWaitlistStore(filePath);
}

export function createWaitlistStore(env: WaitlistEnvironment = process.env): WaitlistStore {
  const url = env.KV_REST_API_URL?.trim().replace(/\/+$/, "");
  const token = env.KV_REST_API_TOKEN?.trim();
  const webhook = env.WAITLIST_NOTIFY_WEBHOOK?.trim() || undefined;

  if (url && token) return withNotification(new KvWaitlistStore(url, token), webhook);

  const filePath = env.WAITLIST_FILE?.trim() || path.join(process.cwd(), "data", "waitlist.jsonl");
  return withNotification(new JsonlWaitlistStore(filePath), webhook);
}

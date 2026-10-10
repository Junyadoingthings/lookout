import "server-only";

import Anthropic from "@anthropic-ai/sdk";

/** Server-only Anthropic client. The key never reaches the browser bundle. */
let client: Anthropic | null = null;

export function getAnthropic(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not set");
  }
  client ??= new Anthropic();
  return client;
}

export function aiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/** Model is env-driven; defaults to the current Opus. */
export const AI_MODEL = process.env.ANTHROPIC_MODEL ?? "claude-opus-5-5";

export const MAX_CALLS_PER_DAY = Number(process.env.AI_MAX_CALLS_PER_DAY ?? "200");

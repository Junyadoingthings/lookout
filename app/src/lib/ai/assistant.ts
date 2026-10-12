import "server-only";

import type Anthropic from "@anthropic-ai/sdk";

import { AI_MODEL, getAnthropic } from "./client";
import { copilotSystem } from "./assistant-prompt";
import { COPILOT_TOOLS, runCopilotTool } from "./assistant-tools";

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export type CopilotEvent =
  | { type: "step"; summary: string }
  | { type: "token"; text: string }
  | { type: "done" }
  | { type: "error"; message: string };

const MAX_TOOL_ROUNDS = 6;
const MAX_TOKENS = 1500;
const MAX_HISTORY = 12;

/** Break final text into small chunks so the client can render it progressively. */
function* chunk(text: string): Generator<string> {
  const parts = text.match(/\S+\s*/g) ?? [text];
  let buf = "";
  for (const p of parts) {
    buf += p;
    if (buf.length >= 18) {
      yield buf;
      buf = "";
    }
  }
  if (buf) yield buf;
}

/**
 * Run the copilot as an agentic tool-use loop and yield events. The model may
 * call read-only tools several times; each call is surfaced as a "step" event so
 * the analyst sees what was consulted. The final answer is streamed as tokens.
 *
 * The caller is responsible for auth and rate limiting (one reservation per
 * invocation). This function assumes the AI is configured.
 */
export async function* runAssistant(
  history: ChatTurn[],
  context?: { route?: string; alertId?: string },
): AsyncGenerator<CopilotEvent> {
  const client = getAnthropic();

  const messages: Anthropic.MessageParam[] = history
    .slice(-MAX_HISTORY)
    .map((t) => ({ role: t.role, content: t.content }));

  try {
    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const message = await client.messages.create({
        model: AI_MODEL,
        max_tokens: MAX_TOKENS,
        system: copilotSystem(context),
        tools: COPILOT_TOOLS,
        messages,
      });

      const toolUses = message.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
      );

      if (message.stop_reason !== "tool_use" || toolUses.length === 0) {
        // Final answer. Stream the text blocks.
        const text = message.content
          .filter((b): b is Anthropic.TextBlock => b.type === "text")
          .map((b) => b.text)
          .join("")
          .trim();
        for (const piece of chunk(text || "I do not have an answer for that.")) {
          yield { type: "token", text: piece };
        }
        yield { type: "done" };
        return;
      }

      // Record the assistant's tool-use turn, then run each tool.
      messages.push({ role: "assistant", content: message.content });
      const results: Anthropic.ToolResultBlockParam[] = [];
      for (const use of toolUses) {
        const { result, summary } = await runCopilotTool(
          use.name,
          (use.input ?? {}) as Record<string, unknown>,
        );
        yield { type: "step", summary };
        results.push({
          type: "tool_result",
          tool_use_id: use.id,
          content: JSON.stringify(result),
        });
      }
      messages.push({ role: "user", content: results });
    }

    yield {
      type: "token",
      text: "I looked at several things but could not finish. Try a narrower question.",
    };
    yield { type: "done" };
  } catch (e) {
    yield { type: "error", message: friendlyError(e) };
  }
}

/** Turn raw SDK/network errors into one short, safe sentence for the analyst. */
function friendlyError(e: unknown): string {
  const status =
    typeof (e as { status?: unknown })?.status === "number"
      ? (e as { status: number }).status
      : undefined;
  if (status === 401) return "The Anthropic API key is invalid. Check ANTHROPIC_API_KEY.";
  if (status === 429) return "Anthropic is rate limiting right now. Try again in a moment.";
  if (status === 529 || status === 503) return "The AI service is busy. Try again shortly.";
  if (e instanceof Error && /fetch|network|ENOTFOUND|ECONNREFUSED/i.test(e.message)) {
    return "Could not reach the AI service. Check the server's network.";
  }
  return "The copilot hit an error. Try again.";
}

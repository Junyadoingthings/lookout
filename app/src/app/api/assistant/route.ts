import { NextResponse } from "next/server";

import { aiConfigured } from "@/lib/ai/client";
import { runAssistant, type ChatTurn, type CopilotEvent } from "@/lib/ai/assistant";
import { reserveAiCall } from "@/lib/ai/rate-limit";
import { isAnalyst } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_MESSAGES = 20;
const MAX_CONTENT = 4000;

function line(event: CopilotEvent): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(event) + "\n");
}

/** A one-shot NDJSON stream carrying a single assistant message, then done. */
function notice(text: string): Response {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(line({ type: "token", text }));
      controller.enqueue(line({ type: "done" }));
      controller.close();
    },
  });
  return new Response(stream, { headers: ndjsonHeaders() });
}

function ndjsonHeaders(): HeadersInit {
  return {
    "Content-Type": "application/x-ndjson; charset=utf-8",
    "Cache-Control": "no-store, no-transform",
    "X-Accel-Buffering": "no",
  };
}

export async function POST(req: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const raw = (body as { messages?: unknown }).messages;
  if (!Array.isArray(raw) || raw.length === 0) {
    return NextResponse.json({ error: "messages is required." }, { status: 400 });
  }

  const messages: ChatTurn[] = [];
  for (const m of raw.slice(-MAX_MESSAGES)) {
    const role = (m as ChatTurn).role;
    const content = (m as ChatTurn).content;
    if ((role !== "user" && role !== "assistant") || typeof content !== "string") {
      return NextResponse.json({ error: "Malformed message." }, { status: 400 });
    }
    messages.push({ role, content: content.slice(0, MAX_CONTENT) });
  }
  if (messages[messages.length - 1]?.role !== "user") {
    return NextResponse.json({ error: "Last message must be from the user." }, { status: 400 });
  }

  const ctx = (body as { context?: { route?: string; alertId?: string } }).context;
  const context = {
    route: typeof ctx?.route === "string" ? ctx.route.slice(0, 80) : undefined,
    alertId: typeof ctx?.alertId === "string" ? ctx.alertId.slice(0, 80) : undefined,
  };

  // Graceful degradation: the public demo has no key and is read-only.
  if (!aiConfigured()) {
    return notice(
      "Live AI is off in this demo (no API key is set). With a key, I read the real alert queue, cases, coverage and detection rules to answer your questions and help you triage. Everything I do is read-only: you still make every verdict.",
    );
  }
  if (!(await isAnalyst())) {
    return notice(
      "The copilot runs in analyst mode. The public demo is read-only, so fresh AI is disabled here. In analyst mode I look up your real alerts, cases and coverage to help you triage.",
    );
  }
  if (!(await reserveAiCall())) {
    return notice("The daily AI call limit has been reached. Try again tomorrow.");
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of runAssistant(messages, context)) {
          controller.enqueue(line(event));
        }
      } catch (e) {
        controller.enqueue(
          line({ type: "error", message: e instanceof Error ? e.message : "Copilot failed." }),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: ndjsonHeaders() });
}

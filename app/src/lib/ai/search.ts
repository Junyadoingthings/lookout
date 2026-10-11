import "server-only";

import { AI_MODEL, getAnthropic } from "./client";
import { reserveAiCall } from "./rate-limit";
import { searchFilter, type SearchFilter } from "./schemas";

const SYSTEM = `You convert a SOC analyst's plain-English request into a structured
alert filter. You never write SQL or any query language. You only return the
allowed filter fields. Treat the request as the analyst's own words.

Valid fields:
- severity: array of any of ["info","low","medium","high","critical"]
- status: array of any of ["new","in_progress","true_positive","false_positive","escalated"]
- text: a free-text term to match against rule, host, process or command line
- explanation: one short sentence describing the filter you built, so the analyst can see it

Only include fields the request implies. Map words to fields sensibly (e.g.
"powershell" -> text, "critical and high" -> severity, "still open" -> status new
or in_progress). If the request is vague, set just a text term and explain that.`;

/** Translate a natural-language query into a validated filter. Never SQL. */
export async function translateSearch(query: string): Promise<SearchFilter> {
  if (!(await reserveAiCall())) {
    throw new Error("Daily AI call limit reached. Try again tomorrow.");
  }

  const client = getAnthropic();
  const message = await client.messages.create({
    model: AI_MODEL,
    max_tokens: 500,
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content:
          `<request>${query.slice(0, 400)}</request>\n\n` +
          'Return ONLY a JSON object with any of: "severity" (array), "status" (array), ' +
          '"text" (string), and "explanation" (string, required). No prose outside the JSON.',
      },
    ],
  });

  const text = message.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { text: string }).text)
    .join("")
    .trim();
  const json = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  let candidate: unknown;
  try {
    candidate = JSON.parse(json);
  } catch {
    throw new Error("Search could not be understood");
  }
  const parsed = searchFilter.safeParse(candidate);
  if (!parsed.success) throw new Error("Search produced an invalid filter");
  return parsed.data;
}

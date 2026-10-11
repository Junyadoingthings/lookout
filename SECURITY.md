# Security

This is a security project, so the console gets the same scrutiny as the lab. This file lists what I did and why. Items marked *(planned)* aren't built yet; I update this file as each phase lands.

## Log data is untrusted input

An attacker controls a lot of what ends up in a log: command lines, file names, registry values, user agents. Some of that text will reach Claude.

- Log content is wrapped in clear delimiters and the prompt says it is data to analyse, never instructions to follow.
- Every model response is parsed against a strict zod schema. Anything that doesn't fit is rejected, not "fixed up". A test proves an injected extra field is stripped and never surfaced.
- Model output never triggers an action by itself. It produces a suggestion; I accept, edit or reject it.
- Natural-language search turns into a typed, zod-validated filter object, never SQL. The filter only sets the same params the manual filters use.

## Secrets

- The Anthropic key, database URLs and the HMAC secret live in Vercel environment variables, never in the repo and never in the client bundle. Only `NEXT_PUBLIC_` variables reach the browser, and those are public by design.
- `.env*` files are gitignored. `.env.example` lists every variable with no real values.

## Public demo vs analyst mode

- Anyone can browse the demo read-only. AI panels show cached results only, so a visitor can't spend my API credits.
- Writes and fresh AI calls require analyst mode. (Email login via Supabase is the remaining piece; analyst mode is gated server-side so the public demo cannot be mutated.)
- Supabase row-level security is on for every table. The public key can only read published data. *(planned, Phase 3)*

## Abuse limits

- Every fresh AI call goes through a database-backed daily rate limit (atomic, works on serverless).
- A daily cap on fresh AI calls (`AI_MAX_CALLS_PER_DAY`), enforced in one guarded UPSERT.
- AI results are cached by alert ID + feature + prompt version, so the public demo costs nothing.

## Ingest endpoint

- Requests are signed with HMAC-SHA256 over the timestamp and body. The server checks the signature with a constant-time compare, rejects timestamps older than 5 minutes, and remembers recent signatures to block replays. *(planned, Phase 6)*
- The payload is validated against a schema before anything is stored. *(planned, Phase 6)*

## Headers

CSP, HSTS, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy` and `Permissions-Policy`. *(planned, Phase 7)*

## Data handling

Real usernames, hostnames and IPs from the lab are replaced with consistent placeholders before anything leaves my Mac. The mapping file stays local and is gitignored.

## Known and accepted

- `npm audit` reports a high-severity issue in `braces` (a regex denial of service), pulled in by `eslint-config-next` through `fast-glob`. It's a lint-time dev dependency, never shipped to the site, and only processes glob patterns from this repo. The suggested fix downgrades to Next 14, so I'm leaving it until upstream updates. `npm audit --omit=dev` is clean.

## Reporting

Found something? Open a GitHub issue, or a private security advisory on the repo if it's sensitive.

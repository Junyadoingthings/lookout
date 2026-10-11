# Deploy to Vercel

The console is a standard Next.js app. These steps put the public demo online.

## 1. Push the repo to GitHub

```bash
cd ~/Developer/lookout
git remote add origin https://github.com/<you>/lookout.git   # if not set
git push -u origin main
```

Nothing secret is committed: `.env*` is gitignored and `lab/export/mapping.json`
(the real-to-placeholder map) stays local.

## 2. Create the Vercel project

1. On vercel.com, **Add New Project** and import the GitHub repo.
2. Set the **Root Directory** to `app` (the Next.js app lives there, not the repo root).
3. Framework preset: Next.js. Leave the build command as default.

## 3. Environment variables

In the Vercel project settings, add these (Production and Preview):

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | Supabase pooled connection (port 6543), no `?pgbouncer=true` |
| `DATABASE_URL_DIRECT` | Supabase direct connection (port 5432) |
| `ANTHROPIC_API_KEY` | your `sk-ant-...` key (optional: without it, AI panels stay cached-only) |
| `ANTHROPIC_MODEL` | e.g. `claude-opus-5-5` (or a cheaper model) |
| `AI_MAX_CALLS_PER_DAY` | e.g. `200` |
| `NEXT_PUBLIC_SITE_URL` | your Vercel URL, e.g. `https://lookout.vercel.app` (fixes OG image links) |

The key is read server-side only; it never reaches the browser bundle.

## 4. Database schema and data

The tables are created from your machine against Supabase (not during the Vercel
build), so run once locally after setting `.env.local`:

```bash
cd app
npm run db:push     # creates alerts, cases, ai_analyses, ai_usage
npm run export      # pull real alerts from the lab (VM must be running)
npm run import      # load the sanitised alerts
# or, for a demo without the lab:
npm run seed
```

## 5. Supabase row-level security

In the Supabase SQL editor, enable RLS so the anon/publishable key can only read:

```sql
alter table alerts enable row level security;
alter table cases enable row level security;
alter table ai_analyses enable row level security;
create policy "public read" on alerts for select using (true);
create policy "public read" on cases for select using (true);
create policy "public read" on ai_analyses for select using (true);
```

The app connects with the Postgres connection string (service role) for the
server actions, which bypass RLS by design; RLS protects any direct use of the
publishable key.

## 6. Security headers

These ship in `src/middleware.ts` and apply automatically: a nonce-based
Content-Security-Policy, HSTS, `X-Frame-Options: DENY`, `X-Content-Type-Options`,
`Referrer-Policy`, and `Permissions-Policy`. No extra Vercel config needed.

## 7. After deploy

- Open the Vercel URL. The public demo is read-only: AI panels show cached
  results, and verdict changes are locked.
- Run a Lighthouse check (Chrome DevTools, incognito). Aim for 90+ on performance
  and accessibility.
- Put the live link in the README and on LinkedIn.

## Analyst mode in production

The public deploy is locked to read-only by default (the analyst gate is off in
production until email login is wired). To use analyst mode yourself after
deploying, the remaining step is Supabase email auth gated to `ANALYST_EMAIL`.
Until then, run analyst features locally (`npm run dev`), where analyst mode is on.

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

The app never uses Supabase's Data API (the publishable/anon key). Every query
goes through `DATABASE_URL` as the `postgres` role, which has `BYPASSRLS`. So the
right setting is **RLS on, no policies**: the server keeps full access and
anyone holding the public key gets nothing.

Supabase grants `anon` and `authenticated` full rights (including `DELETE` and
`TRUNCATE`) on every new table in `public`, so with RLS off the whole database is
writable by anyone with the project URL. In the Supabase SQL editor, run:

```sql
begin;
alter table public.alerts      enable row level security;
alter table public.cases       enable row level security;
alter table public.ai_analyses enable row level security;
alter table public.ai_usage    enable row level security;
-- Defence in depth: the app never needs these roles on our tables.
revoke all on table public.alerts, public.cases, public.ai_analyses, public.ai_usage
  from anon, authenticated;
commit;
```

Then confirm that every row shows `rls = true` and `public_grants = 0`:

```sql
select c.relname as table, c.relrowsecurity as rls,
  (select count(*) from information_schema.role_table_grants g
    where g.table_schema = 'public' and g.table_name = c.relname
      and g.grantee in ('anon', 'authenticated')) as public_grants
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r' order by 1;
```

`src/db/schema.ts` declares `.enableRLS()` on every table, so `npm run db:push`
keeps RLS on. Any new table must do the same.

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

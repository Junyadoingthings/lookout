# Alert export and sanitisation

Moves real detections from the Wazuh lab into the console's database, with every
real identifier replaced by a stable placeholder first.

## Pipeline

```
Wazuh indexer (192.168.64.5:9200)
      | export-alerts.ts  (fetch -> parse -> sanitise)
      v
alerts.sanitized.json   (committed: safe, no real data)
mapping.json            (gitignored: real -> placeholder, stays local)
      | import-alerts.ts  (upsert into Postgres)
      v
Supabase / Postgres  ->  the console
```

The scripts live in `app/scripts/` because they share the parser and sanitiser
in `app/src/lib/wazuh/` (which have unit tests). Run them from `app/`.

## What gets sanitised

- Hostnames -> `WORKSTATION-01`, `WORKSTATION-02`, ...
- Usernames -> `user01`, `user02`, ... (domain prefix handled separately)
- IPv4 addresses -> `192.0.2.N` (RFC 5737 documentation range); loopback is kept

The same real value always maps to the same placeholder, so process trees and
timelines still line up. `mapping.json` is never committed.

## Usage

```bash
cd app
# 1. set WAZUH_INDEXER_* in app/.env.local (see ../.env.example)
npm run export        # writes lab/export/alerts.sanitized.json
npm run import        # upserts into the DB named by DATABASE_URL
```

For development without the lab running:

```bash
npm run seed          # inserts a few labelled SAMPLE alerts
npm run seed -- --clear
```

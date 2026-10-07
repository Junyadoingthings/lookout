# Setup

A step-by-step guide to building the lab and running the console, from zero, on an Apple Silicon Mac.

> Being written phase by phase. Phase 1 (building the VMs and installing Wazuh, Sysmon and the agent) is next.

## What you need

- An Apple Silicon Mac with 16 GB RAM and about 120 GB free disk
- Node.js 22
- [UTM](https://mac.getutm.app/) 4.7 or later
- About an afternoon for the lab

Versions and why they were picked: [ARCHITECTURE.md](ARCHITECTURE.md#versions).

## 1. Run the console locally

1. Install dependencies:

   ```bash
   cd app
   npm install
   ```

2. Start the dev server:

   ```bash
   npm run dev
   ```

   **You should see:** `Local: http://localhost:3000`. Open it and you get a page that says VANTAGE.

3. Run the checks:

   ```bash
   npm run check
   ```

   **You should see:** no lint or type errors, and all unit tests passing.

**If it didn't work**

- `command not found: npm`: Node isn't installed or isn't on your `PATH`. Run `node -v`; you want `v22.x`.
- `EBADENGINE` warnings: you're on an older Node. Install Node 22.
- Port 3000 in use: run `npm run dev -- --port 3001`.

## 2. Build the lab

Coming in Phase 1.

## Troubleshooting

Collected as we hit problems.

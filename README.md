# ATM App

ATM simulator built as a TypeScript monorepo with:

- `apps/web`: React + Vite frontend
- `apps/api`: Express backend
- `packages/shared`: shared constants, schemas, and types

The app lets a customer verify a PIN, open an ATM-style main menu, review balance and recent transactions, choose a withdrawal amount, and receive a receipt-style result. The backend enforces exact note dispensing, overdraft limits, and stop-on-first-failure session behavior.

State is intentionally kept in memory today rather than stored in a persistent database, so ATM inventory and session-related data reset across server restarts. That keeps the app lightweight for the current scope, while leaving room to add persistent storage later if the product needs cross-session history or durable machine state.

## App Features

- PIN verification against the external PIN API
- ATM main menu with quick cash and custom amount flows
- Balance and previous transaction screens
- Exact dispensing using `£20`, `£10`, and `£5` notes
- Deterministic note selection
- Overdraft support down to `-100`
- Receipt-style withdrawal results and session summary

## Installation

Requirements:

- `Node.js` 20+
- `npm`

Install dependencies from the repo root:

```bash
npm install
```

## Running Locally

Start both apps from the repo root:

```bash
npm run dev
```

This starts:

- web app: `http://localhost:5173`
- API: `http://localhost:3001`

The Vite dev server proxies `/api` requests to the local Express API.

Demo details:

- demo PIN: `1111`
- web flow starts from the ATM landing screen

## Local Workflows

Run all tests:

```bash
npm test
```

Run type checks:

```bash
npm run typecheck
```

Build all workspaces:

```bash
npm run build
```

Common development loop:

1. Run `npm install`
2. Start the app with `npm run dev`
3. Make changes in `apps/web`, `apps/api`, or `packages/shared`
4. Run `npm test`
5. Run `npm run typecheck`

## API Snapshot

Main endpoints:

- `POST /api/atm/pin`
- `POST /api/atm/session`
- `GET /api/health`

Example session request:

```json
{
  "pin": "1111",
  "withdrawals": [40]
}
```

Common API responses:

- `400` invalid request body
- `403` invalid PIN
- `502` upstream PIN API failure or malformed PIN API response

## Documentation

Additional project docs live in `docs/`:

- `docs/ARCHITECTURE.md`: system structure, runtime flow, and component boundaries
- `docs/DEVELOPMENT_FLOW.md`: implementation timeline, major decisions, and future features
- `docs/PLANS.md`: original implementation spec and acceptance criteria

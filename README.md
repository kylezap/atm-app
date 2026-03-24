# ATM App

TypeScript monorepo for a lightweight ATM flow with:

- `apps/web`: React + Vite UI for entering a PIN and a runtime withdrawal sequence
- `apps/api`: Express API that authenticates the PIN, processes withdrawals, and returns a session summary
- `packages/shared`: shared constants, Zod schemas, and TypeScript types

## Behavior

- The caller provides `pin` and `withdrawals`
- The API authenticates once against the external PIN API
- Withdrawals are processed in order
- Each withdrawal must be dispensed exactly using fixed `£20`, `£10`, and `£5` notes
- The ATM chooses the most even exact note combination, then breaks ties by fewer notes and larger denominations
- Processing stops on the first failure
- Overdraft is allowed down to `-100`
- Every successful withdrawal with a negative resulting balance returns an overdraft warning

## Quick Start

```bash
npm install
npm run dev
```

This starts:

- web app at `http://localhost:5173`
- API at `http://localhost:3001`

## Useful Scripts

```bash
npm run dev
npm run test
npm run typecheck
npm run build
```

## API

`POST /api/atm/session`

Request body:

```json
{
  "pin": "1111",
  "withdrawals": [140, 50, 90]
}
```

Successful response shape:

```json
{
  "authenticated": true,
  "startingBalance": 220,
  "withdrawals": [
    {
      "amount": 140,
      "status": "success",
      "dispensedNotes": { "5": 4, "10": 4, "20": 4 },
      "balanceBefore": 220,
      "balanceAfter": 80,
      "overdraftWarning": false,
      "remainingNotes": { "5": 0, "10": 11, "20": 3 }
    }
  ],
  "endingBalance": 80,
  "remainingNotes": { "5": 0, "10": 11, "20": 3 }
}
```

Common error responses:

- `400` invalid request body
- `403` invalid PIN
- `502` upstream PIN API failure or malformed PIN API response

## Testing

Current automated coverage includes:

- PIN API client success and failure handling
- inventory mutation safety
- deterministic note dispensing
- withdrawal sequencing, overdraft rules, and stop-on-first-failure behavior
- API request validation and PIN-related HTTP error handling

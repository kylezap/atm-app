# ATM App Implementation Spec

## Goal

Build a lightweight ATM application that:

- Authenticates a user via the external Pin API.
- Retrieves the user's starting balance from the API response.
- Processes three withdrawals in order: `140`, `50`, `90`.
- Dispenses notes using the ATM's available inventory.
- Allows an overdraft down to `-100`.
- Warns the user when a successful withdrawal causes or keeps the balance below `0`.

## Proposed Scope

This spec assumes a lightweight Node.js application with a small domain layer and a simple interface layer.

- No database.
- No persistent storage.
- ATM note inventory exists in memory for the runtime of the app.
- One user session at a time.
- One sequence of withdrawals per run.

## Explicit Assumptions

These assumptions should be treated as part of the implementation unless changed later.

1. The Pin API is called once at the start of the session.
2. A successful Pin API response provides the starting balance and authenticates the user.
3. The app manages the running balance locally after authentication.
4. The withdrawals must be attempted in this exact order: `140`, then `50`, then `90`.
5. Each successful withdrawal updates both the user balance and remaining ATM note inventory.
6. Each withdrawal must be dispensed exactly or be rejected.
7. Partial withdrawals are not allowed.
8. If a withdrawal fails, the app stops processing any later withdrawals.
9. The overdraft limit means the resulting balance may be as low as `-100`.
10. Any withdrawal that would make the balance less than `-100` must be rejected.
11. The app should notify the user on every successful withdrawal where the resulting balance is below `0`.
12. Wrong PIN or malformed PIN request ends the flow before any withdrawal attempt.

## External API Contract

### Pin API

- Method: `POST`
- URL: `https://pinapi.screencloudsolutions.com/api/pin`
- Content-Type: `application/json`
- Request body:

```json
{ "pin": "1111" }
```

### Expected responses

- `200 OK`

```json
{ "currentBalance": 220 }
```

- `403 Forbidden`
  - Means the PIN is wrong.
- Any other non-`200` response
  - Treat as an API failure.
- Any `200` response without a numeric `currentBalance`
  - Treat as an invalid API response.

## ATM Inventory

Initial note inventory:

- `4 x £5`
- `15 x £10`
- `7 x £20`

Initial cash total: `310`

## Note Dispensing Rule

“Distribute the notes as evenly as possible” is defined here as:

1. Find all exact note combinations that satisfy the requested amount using the remaining inventory.
2. Prefer the combination with the lowest spread between note usage counts across all supported denominations, including zero for unused denominations.
3. If multiple combinations are equally even, prefer the one using fewer total notes.
4. If still tied, prefer the one using larger denominations first.
5. If no exact combination exists, reject the withdrawal.

### Practical interpretation

This means the app should avoid overly skewed combinations and should treat unused denominations as part of the balance calculation, but it should still remain deterministic.

### Deterministic examples

For `£50`, the preferred combination should be:

- `1 x £20`
- `2 x £10`
- `2 x £5`

instead of:

- `2 x £20`
- `1 x £10`

because the first mix has note counts of `1, 2, 2`, while the second has `2, 1, 0`, so the first is more evenly distributed across all supported denominations.

## Balance Rule

For each withdrawal:

- `newBalance = currentBalance - withdrawalAmount`
- If `newBalance < -100`, reject the withdrawal.
- If `newBalance >= -100`, the withdrawal may proceed, subject to note availability.
- If `newBalance < 0` after a successful withdrawal, include an overdraft warning.

## Processing Order

The application flow should be:

1. Authenticate with the Pin API.
2. Read starting balance from `currentBalance`.
3. Seed ATM inventory with the initial note counts.
4. Attempt withdrawal `140`.
5. If successful, attempt withdrawal `50`.
6. If successful, attempt withdrawal `90`.
7. Stop immediately on the first failure.
8. Return a final summary of all successful withdrawals and the ending ATM state.

## Failure Rules

### Authentication failure

- If the API returns `403`, return a user-facing error such as `Invalid PIN`.
- If the API returns another error or malformed body, return a user-facing error such as `Unable to verify PIN`.

### Withdrawal failure

A withdrawal fails if:

- The resulting balance would be below `-100`.
- The ATM cannot dispense the amount exactly with the remaining notes.

When a withdrawal fails:

- Do not modify the balance.
- Do not modify ATM inventory.
- Do not process remaining withdrawals.
- Return the failure reason and the state up to the point of failure.

## Proposed Output Shape

The app should return structured results per withdrawal.

```json
{
  "authenticated": true,
  "startingBalance": 220,
  "withdrawals": [
    {
      "amount": 140,
      "status": "success",
      "dispensedNotes": { "20": 4, "10": 4, "5": 4 },
      "balanceBefore": 220,
      "balanceAfter": 80,
      "overdraftWarning": false,
      "remainingNotes": { "20": 3, "10": 11, "5": 0 }
    }
  ],
  "endingBalance": 80,
  "remainingNotes": { "20": 3, "10": 11, "5": 0 }
}
```

If a withdrawal fails, include:

```json
{
  "amount": 90,
  "status": "failed",
  "reason": "INSUFFICIENT_NOTES"
}
```

Recommended failure codes:

- `INVALID_PIN`
- `PIN_API_ERROR`
- `INVALID_PIN_RESPONSE`
- `OVERDRAFT_LIMIT_EXCEEDED`
- `INSUFFICIENT_NOTES`

## Suggested Internal Modules

### `pin-service`

Responsibilities:

- Call the external Pin API.
- Validate the response.
- Return either a numeric starting balance or a typed error.

### `atm-inventory`

Responsibilities:

- Hold current note counts.
- Check whether a combination is available.
- Deduct dispensed notes after success.

### `note-dispenser`

Responsibilities:

- Generate all valid exact note combinations for a withdrawal.
- Rank them using the even-distribution rules.
- Return the best deterministic combination.

### `withdrawal-service`

Responsibilities:

- Enforce overdraft rules.
- Ask the dispenser for a valid note mix.
- Apply successful balance and inventory updates.
- Return structured withdrawal results.

### `app/orchestrator`

Responsibilities:

- Authenticate once.
- Process the withdrawal sequence in order.
- Stop on failure.
- Return the final session summary.

## Acceptance Criteria

### Authentication

- Given PIN `1111`, when the Pin API returns `200` with `{ "currentBalance": 220 }`, the app starts with balance `220`.
- Given a wrong PIN, when the Pin API returns `403`, the app stops and returns `INVALID_PIN`.
- Given a malformed or unexpected API response, the app stops and returns `INVALID_PIN_RESPONSE` or `PIN_API_ERROR`.

### Overdraft

- A withdrawal is allowed if the resulting balance is exactly `-100`.
- A withdrawal is rejected if the resulting balance is less than `-100`.
- A successful withdrawal that leaves the balance below `0` returns an overdraft warning.

### Notes

- A withdrawal only succeeds if the ATM can dispense the exact amount.
- Remaining note counts must decrease only after a successful withdrawal.
- The note selection algorithm must return the same valid combination every time for the same input state.

### Ordered scenario

Given:

- starting balance `220`
- overdraft limit `100`
- notes `{ 5: 4, 10: 15, 20: 7 }`
- withdrawals `[140, 50, 90]`

When the app processes the sequence:

- it must attempt `140` first
- then `50`
- then `90`
- stopping at the first failed withdrawal

### Final-state integrity

- The final balance must equal the starting balance minus the sum of successful withdrawals.
- The final note counts must equal the initial counts minus all dispensed notes from successful withdrawals.

## Test Plan

Minimum automated test coverage should include:

1. Successful PIN authentication.
2. Wrong PIN returns `INVALID_PIN`.
3. Non-`200` Pin API error handling.
4. Invalid `currentBalance` response handling.
5. Withdrawal succeeds without overdraft.
6. Withdrawal succeeds at exactly `-100`.
7. Withdrawal fails below `-100`.
8. Withdrawal fails when exact amount cannot be dispensed.
9. Note inventory updates correctly after each success.
10. Processing stops after the first failed withdrawal.
11. The note-selection algorithm is deterministic.
12. The full `[140, 50, 90]` scenario runs correctly from the initial machine state.

## Open Items To Confirm Later

These do not block implementation if we accept the assumptions above, but they should be confirmed.

- Whether “evenly as possible” should optimize each withdrawal independently or optimize across the full 3-withdrawal sequence.
- Whether the app should expose a CLI, HTTP endpoint, or both.
- Whether note denominations should remain fixed or be configurable.
- Whether overdraft warnings should be repeated on every negative-balance withdrawal or only when crossing from non-negative to negative.

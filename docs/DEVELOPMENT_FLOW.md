# ATM Development Flow

## Purpose
This document summarizes how the ATM app evolved from the original spec into the current implementation, what major decisions landed along the way, and what features are good next candidates.

## Development Timeline
1. **Project bootstrap**
   - `init commit`, `init npm`, `set up workspace root`
   - The repo was established as a TypeScript monorepo with shared root tooling.

2. **Requirements capture**
   - `add init spec`, `add spec`
   - `docs/PLANS.md` defined the original target: authenticate once, process the fixed withdrawal sequence `[140, 50, 90]`, enforce overdraft and exact-note rules, and return structured results.

3. **Shared contract and workspace scaffolding**
   - `add shared atm contracts`
   - `scaffold express api workspace`
   - `scaffold react web workspace`
   - Shared constants, types, and schemas were introduced so the web and API could use one contract.

4. **Early app wiring**
   - `fix orchestrator session state`
   - `add dev workflow and api tests`
   - The API composition started to settle, with test coverage added early enough to keep the core session flow stable while features were still landing.

5. **Cleanup before domain implementation**
   - `remove invalid withdrawal placeholder`
   - A placeholder success payload was removed because it violated the shared schema. This was an early quality decision: stop faking final behavior once the real contract existed.

6. **Architecture and product pivot**
   - `add arch doc`
   - `thread runtime withdrawals through session flow`
   - This was the first major product decision change. Instead of hardcoding the original `[140, 50, 90]` sequence, the app moved to caller-supplied withdrawals. That made the system more reusable, but it also drifted from the original spec.

7. **Backend domain implementation**
   - `implement pin api client and inventory mutations`
   - `implement withdrawal sequencing and note dispensing`
   - Core backend behavior landed here:
     - external PIN API integration
     - mutable in-memory note inventory
     - overdraft enforcement
     - deterministic note selection
     - ordered processing with stop-on-first-failure

8. **Hardening and documentation**
   - `test atm session http error handling`
   - `sync docs with implemented atm flow`
   - The API error behavior was covered more explicitly, and the docs were updated to match the implementation rather than the original plan.

9. **Session continuity features**
   - `add ATM pin verification and transaction history`
   - Another important product decision landed here:
     - immediate PIN verification endpoint
     - recent transaction history stored in the API service
     - restored authenticated state after login
   - This improved UX, but it also introduced a second authentication step in the end-to-end flow instead of a single PIN API call per session.

10. **Web UX expansion**
    - `rebuild the web ATM flow around the main menu`
    - The frontend changed from a thin session trigger into a richer ATM experience with:
      - a main menu
      - quick cash
      - custom amount entry
      - balance view
      - previous transactions
      - overdraft warning modal
      - stronger UI-level test coverage

11. **Polish and recovery**
    - `ignore local gstack artifacts`
    - `refine authenticated ATM sidebar and result actions`
    - The latest changes simplified the authenticated sidebar into a welcome card and made failed withdrawals recoverable by exposing a path back to the main menu.

## What Shipped
- A monorepo with `apps/web`, `apps/api`, and `packages/shared`
- Shared request and response contracts
- External PIN API verification
- Exact-note dispensing with deterministic tie-breaking
- In-memory ATM inventory updates after successful withdrawals
- Ordered withdrawal processing with stop-on-first-failure
- Overdraft support down to `-100`
- Web ATM screens for PIN entry, main menu, balance, transactions, amount selection, confirmation, processing, receipt, and summary
- Automated API and web tests

## Key Decisions Made
### 1. Shared contracts first
The app standardized types and schemas early. That made it easier to evolve the API and web together without silent drift inside the codebase.

### 2. In-memory state instead of persistence
The app stayed aligned with the lightweight scope by keeping note inventory and transaction history in memory. That kept implementation fast and testable, but it limits realism across refreshes and server restarts.

### 3. Runtime withdrawals instead of a fixed sequence
The original spec called for `[140, 50, 90]`, but the app was intentionally moved toward caller-selected withdrawals. This made the product feel more like a real ATM and enabled the richer UI flow.

### 4. Immediate PIN verification as a separate step
Adding `/api/atm/pin` improved the UX by letting the UI authenticate before showing the menu, current balance, and history. The tradeoff is that the full end-to-end flow no longer matches the original "authenticate once, then run the sequence" shape exactly.

### 5. UX realism over spec literalism
The later commits clearly optimized for a believable ATM experience:
- menu-driven navigation
- balance and history screens
- receipt-style summaries
- overdraft confirmation
- recovery paths after failure

## Where The App Drifted From The Original Plan
- The original spec expected one fixed withdrawal sequence. The implemented product accepts user-driven amounts.
- The original spec expected one PIN API call at the start of the session. The implemented product verifies the PIN first and then authenticates again for the session.
- The original plan was closer to a controlled scenario runner. The implemented product is closer to a small interactive ATM simulator.

## Future Features
### 1. Choosing notes
Allow the customer to choose the note mix instead of always accepting the automatically selected "most even" combination.

Possible scope:
- Show available exact combinations for the requested amount
- Keep the current algorithm as the default recommendation
- Validate the selected note mix against remaining inventory
- Preserve deterministic fallback behavior if the user does not choose
- Update the receipt and result summary to show whether the note mix was system-selected or user-selected

Implementation considerations:
- API: extend the withdrawal request to optionally include a requested note combination
- Domain: add validation for user-selected note mixes before deducting inventory
- UI: add a note-choice step between amount confirmation and processing
- Tests: cover invalid mixes, unavailable notes, and fallback behavior

### 2. Depositing
Add deposit support so the ATM can accept money as well as dispense it.

Possible scope:
- Let the customer enter a deposit amount by denomination
- Increase account balance after a successful deposit
- Increase ATM inventory when notes are accepted
- Record deposits in transaction history with a separate result type
- Add a deposit receipt and updated balance summary

Implementation considerations:
- Shared types: add deposit request and result shapes
- Domain: introduce deposit validation and inventory increments
- Service layer: support mixed transaction history, not only withdrawals
- UI: add a deposit path in the main menu and a denomination entry screen
- Rules to decide: whether deposits are notes-only, whether coins are unsupported, and whether the machine validates note authenticity or simply assumes valid input in demo mode

## Recommended Next Step
If the goal is to stay close to the original interview-style spec, tighten the current product around the fixed sequence before adding new features.

If the goal is to keep evolving the ATM simulator, `choosing notes` is the cleaner next feature because it builds directly on the current withdrawal engine and UI.

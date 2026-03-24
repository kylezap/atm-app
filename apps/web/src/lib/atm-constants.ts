export const QUICK_CASH_AMOUNTS = [20, 40, 60, 80, 100, 140] as const;

export const PROCESSING_STAGES = [
  "Verifying PIN",
  "Checking balance",
  "Counting notes",
  "Preparing cash",
] as const;

export const PIN_SUCCESS_TIMEOUT_MS = 2500;

export const TOTAL_WITHDRAWALS = 1;

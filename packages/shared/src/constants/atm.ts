export const SUPPORTED_DENOMINATIONS = [20, 10, 5] as const;

export const DEFAULT_WITHDRAWAL_SEQUENCE = [140, 50, 90] as const;

export const INITIAL_NOTE_COUNTS = {
  5: 4,
  10: 15,
  20: 7,
} as const;

export const OVERDRAFT_LIMIT = 100;

export const PIN_API_URL = "https://pinapi.screencloudsolutions.com/api/pin";

export const ERROR_CODES = [
  "INVALID_PIN",
  "PIN_API_ERROR",
  "INVALID_PIN_RESPONSE",
  "OVERDRAFT_LIMIT_EXCEEDED",
  "INSUFFICIENT_NOTES",
] as const;

import type { ErrorCode } from "@atm/shared";

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatFailureReason(reason: ErrorCode) {
  switch (reason) {
    case "INVALID_PIN":
      return "Invalid PIN.";
    case "PIN_API_ERROR":
      return "The ATM could not reach the PIN service.";
    case "INVALID_PIN_RESPONSE":
      return "The PIN service returned an unreadable balance.";
    case "OVERDRAFT_LIMIT_EXCEEDED":
      return "This withdrawal exceeds the overdraft floor.";
    case "INSUFFICIENT_NOTES":
      return "The machine cannot make this amount exactly with the notes left.";
  }
}

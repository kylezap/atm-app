import type { WithdrawalResult } from "@atm/shared";
import { formatCurrency, formatFailureReason } from "./atm-format";
import type { TransactionHistoryEntry } from "../types/atm-ui";

function getTransactionHistoryId(result: WithdrawalResult, index: number) {
  if (result.status === "failed") {
    return `failed-${result.amount}-${result.reason}-${index}`;
  }

  return `success-${result.amount}-${result.balanceAfter}-${index}`;
}

export function createTransactionHistoryEntry(
  result: WithdrawalResult,
  index: number,
): TransactionHistoryEntry {
  if (result.status === "failed") {
    return {
      id: getTransactionHistoryId(result, index),
      label: `${formatCurrency(result.amount)} rejected`,
      detail: formatFailureReason(result.reason),
      tone: "failed",
    };
  }

  return {
    id: getTransactionHistoryId(result, index),
    label: `${formatCurrency(result.amount)} dispensed`,
    detail: `Balance now ${formatCurrency(result.balanceAfter)}`,
    tone: "success",
  };
}

export function mapTransactionHistory(results: WithdrawalResult[]) {
  return results.map((result, index) => createTransactionHistoryEntry(result, index));
}

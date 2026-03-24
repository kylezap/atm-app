export type Screen =
  | "idle"
  | "pin"
  | "pinSuccess"
  | "home"
  | "balance"
  | "transactions"
  | "amount"
  | "customAmount"
  | "confirm"
  | "processing"
  | "result"
  | "summary";

export type PendingSource = "quick" | "custom";

export interface TransactionHistoryEntry {
  id: string;
  label: string;
  detail: string;
  tone: "success" | "failed";
}

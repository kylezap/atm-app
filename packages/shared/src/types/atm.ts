import { ERROR_CODES, SUPPORTED_DENOMINATIONS } from "../constants/atm";

export type Denomination = (typeof SUPPORTED_DENOMINATIONS)[number];

export type ErrorCode = (typeof ERROR_CODES)[number];

export type NoteCounts = Record<Denomination, number>;

export interface PinRequest {
  pin: string;
  withdrawals: number[];
}

export interface PinApiSuccessResponse {
  currentBalance: number;
}

export interface FailedWithdrawalResult {
  amount: number;
  status: "failed";
  reason: ErrorCode;
}

export interface SuccessfulWithdrawalResult {
  amount: number;
  status: "success";
  dispensedNotes: NoteCounts;
  balanceBefore: number;
  balanceAfter: number;
  overdraftWarning: boolean;
  remainingNotes: NoteCounts;
}

export type WithdrawalResult =
  | FailedWithdrawalResult
  | SuccessfulWithdrawalResult;

export interface AtmSessionSummary {
  authenticated: boolean;
  startingBalance: number;
  withdrawals: WithdrawalResult[];
  endingBalance: number;
  remainingNotes: NoteCounts;
}

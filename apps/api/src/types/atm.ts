import type { AtmSessionSummary, NoteCounts, PinRequest, WithdrawalResult } from "@atm/shared";

export interface ProcessSessionInput extends PinRequest {}

export interface WithdrawalSequenceResult {
  withdrawals: WithdrawalResult[];
  endingBalance: number;
  remainingNotes: NoteCounts;
}

export interface AtmOrchestrator {
  processSession(input: ProcessSessionInput): Promise<AtmSessionSummary>;
}

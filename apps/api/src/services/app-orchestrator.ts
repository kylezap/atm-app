import { DEFAULT_WITHDRAWAL_SEQUENCE } from "@atm/shared";
import type { AtmSessionSummary } from "@atm/shared";

import type { PinService } from "./pin-service";
import type { WithdrawalService } from "./withdrawal-service";
import type { AtmOrchestrator, ProcessSessionInput } from "../types/atm";

interface CreateAtmOrchestratorOptions {
  pinService: PinService;
  withdrawalService: WithdrawalService;
}

export function createAtmOrchestrator(
  options: CreateAtmOrchestratorOptions,
): AtmOrchestrator {
  return {
    async processSession(input: ProcessSessionInput): Promise<AtmSessionSummary> {
      const authenticationResult = await options.pinService.authenticate(input.pin);
      const withdrawals = await options.withdrawalService.processSequence(
        authenticationResult.currentBalance,
        [...DEFAULT_WITHDRAWAL_SEQUENCE],
      );

      return {
        authenticated: true,
        startingBalance: authenticationResult.currentBalance,
        withdrawals,
        endingBalance: authenticationResult.currentBalance,
        remainingNotes: { 5: 0, 10: 0, 20: 0 },
      };
    },
  };
}

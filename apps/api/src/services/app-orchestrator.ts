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
      const sequenceResult = await options.withdrawalService.processSequence(
        authenticationResult.currentBalance,
        [...input.withdrawals],
      );

      return {
        authenticated: true,
        startingBalance: authenticationResult.currentBalance,
        withdrawals: sequenceResult.withdrawals,
        endingBalance: sequenceResult.endingBalance,
        remainingNotes: sequenceResult.remainingNotes,
      };
    },
  };
}

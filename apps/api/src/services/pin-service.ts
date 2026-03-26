import type { PinApiSuccessResponse, WithdrawalResult } from "@atm/shared";

import type { PinApiClient } from "../clients/pin-api-client";

export interface PinService {
  authenticate(pin: string): Promise<PinApiSuccessResponse>;
  resetAuthentication(): void;
  setCurrentBalance(balance: number): void;
  getRecentTransactions(): WithdrawalResult[];
  recordTransaction(transaction: WithdrawalResult): void;
}

export function createPinService(client: PinApiClient): PinService {
  let currentBalance: number | null = null;
  let recentTransactions: WithdrawalResult[] = [];

  return {
    async authenticate(pin: string) {
      if (currentBalance !== null) {
        return { currentBalance };
      }

      const authenticationResult = await client.verifyPin(pin);
      currentBalance = authenticationResult.currentBalance;

      return { currentBalance };
    },

    resetAuthentication() {
      currentBalance = null;
    },

    setCurrentBalance(balance: number) {
      currentBalance = balance;
    },

    getRecentTransactions() {
      return [...recentTransactions];
    },

    recordTransaction(transaction: WithdrawalResult) {
      recentTransactions = [transaction, ...recentTransactions].slice(0, 5);
    },
  };
}

import type { PinApiSuccessResponse, WithdrawalResult } from "@atm/shared";

import type { PinApiClient } from "../clients/pin-api-client";

export interface PinService {
  authenticate(pin: string): Promise<PinApiSuccessResponse>;
  setCurrentBalance(balance: number): void;
  getRecentTransactions(): WithdrawalResult[];
  recordTransaction(transaction: WithdrawalResult): void;
}

export function createPinService(client: PinApiClient): PinService {
  let currentBalance: number | null = null;
  let authenticatedPin: string | null = null;
  let recentTransactions: WithdrawalResult[] = [];

  return {
    async authenticate(pin: string) {
      if (currentBalance !== null && authenticatedPin === pin) {
        return { currentBalance };
      }

      const authenticationResult = await client.verifyPin(pin);
      authenticatedPin = pin;
      currentBalance = authenticationResult.currentBalance;

      return { currentBalance };
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

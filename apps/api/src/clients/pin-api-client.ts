import type { PinApiSuccessResponse } from "@atm/shared";

import { PIN_API_URL } from "@atm/shared";

import { NotImplementedError } from "../lib/http-error";

export interface PinApiClient {
  verifyPin(pin: string): Promise<PinApiSuccessResponse>;
}

export function createPinApiClient(): PinApiClient {
  return {
    async verifyPin(_pin: string) {
      throw new NotImplementedError(
        `PIN API client for ${PIN_API_URL} is not implemented yet.`,
      );
    },
  };
}

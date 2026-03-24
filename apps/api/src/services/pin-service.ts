import type { PinApiSuccessResponse } from "@atm/shared";

import type { PinApiClient } from "../clients/pin-api-client";

export interface PinService {
  authenticate(pin: string): Promise<PinApiSuccessResponse>;
}

export function createPinService(client: PinApiClient): PinService {
  return {
    authenticate(pin: string) {
      return client.verifyPin(pin);
    },
  };
}

import { describe, expect, it, vi } from "vitest";

import { createPinService } from "./pin-service";
import type { PinApiClient } from "../clients/pin-api-client";

describe("createPinService", () => {
  it("returns the locally updated balance after a successful withdrawal", async () => {
    const client: PinApiClient = {
      verifyPin: vi.fn().mockResolvedValue({ currentBalance: 220 }),
    };
    const service = createPinService(client);

    expect(await service.authenticate("1111")).toEqual({ currentBalance: 220 });

    service.setCurrentBalance(180);

    expect(await service.authenticate("1111")).toEqual({ currentBalance: 180 });
    expect(client.verifyPin).toHaveBeenCalledTimes(2);
  });

  it("stores recent transactions in runtime memory", async () => {
    const client: PinApiClient = {
      verifyPin: vi.fn().mockResolvedValue({ currentBalance: 220 }),
    };
    const service = createPinService(client);
    const transaction = {
      amount: 40,
      status: "success" as const,
      dispensedNotes: { 5: 0, 10: 0, 20: 2 },
      balanceBefore: 220,
      balanceAfter: 180,
      overdraftWarning: false,
      remainingNotes: { 5: 4, 10: 15, 20: 5 },
    };

    await service.authenticate("1111");
    service.recordTransaction(transaction);

    expect(service.getRecentTransactions()).toEqual([transaction]);
  });
});

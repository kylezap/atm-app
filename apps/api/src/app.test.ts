import request from "supertest";
import { describe, expect, it, vi } from "vitest";

import { createApp } from "./app";
import {
  InvalidPinError,
  InvalidPinResponseError,
  PinApiError,
} from "./lib/http-error";
import type { AtmOrchestrator } from "./types/atm";

describe("createApp", () => {
  it("returns ok from the health endpoint", async () => {
    const app = createApp();

    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });

  it("returns 400 for an invalid ATM session request body", async () => {
    const orchestrator: AtmOrchestrator = {
      processSession: vi.fn(),
    };
    const app = createApp({ orchestrator });

    const response = await request(app)
      .post("/api/atm/session")
      .send({ pin: "1111" });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: "Invalid request body." });
    expect(orchestrator.processSession).not.toHaveBeenCalled();
  });

  it("returns the session summary for a valid ATM request", async () => {
    const orchestrator: AtmOrchestrator = {
      processSession: vi.fn().mockResolvedValue({
        authenticated: true,
        startingBalance: 220,
        withdrawals: [],
        endingBalance: 220,
        remainingNotes: { 5: 4, 10: 15, 20: 7 },
      }),
    };
    const app = createApp({ orchestrator });

    const response = await request(app)
      .post("/api/atm/session")
      .send({ pin: "1111", withdrawals: [140, 50, 90] });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      authenticated: true,
      startingBalance: 220,
      withdrawals: [],
      endingBalance: 220,
      remainingNotes: { 5: 4, 10: 15, 20: 7 },
    });
    expect(orchestrator.processSession).toHaveBeenCalledWith({
      pin: "1111",
      withdrawals: [140, 50, 90],
    });
  });

  it("returns 403 when the PIN is invalid", async () => {
    const orchestrator: AtmOrchestrator = {
      processSession: vi.fn().mockRejectedValue(new InvalidPinError()),
    };
    const app = createApp({ orchestrator });

    const response = await request(app)
      .post("/api/atm/session")
      .send({ pin: "9999", withdrawals: [140] });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ message: "Invalid PIN." });
  });

  it("returns 502 for upstream PIN API failures", async () => {
    const app = createApp({
      orchestrator: {
        processSession: vi.fn().mockRejectedValue(new PinApiError()),
      },
    });

    const response = await request(app)
      .post("/api/atm/session")
      .send({ pin: "1111", withdrawals: [140] });

    expect(response.status).toBe(502);
    expect(response.body).toEqual({ message: "Unable to verify PIN." });
  });

  it("returns 502 for malformed successful PIN API responses", async () => {
    const app = createApp({
      orchestrator: {
        processSession: vi
          .fn()
          .mockRejectedValue(new InvalidPinResponseError()),
      },
    });

    const response = await request(app)
      .post("/api/atm/session")
      .send({ pin: "1111", withdrawals: [140] });

    expect(response.status).toBe(502);
    expect(response.body).toEqual({ message: "Unable to verify PIN." });
  });
});

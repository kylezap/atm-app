import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "./app";

describe("createApp", () => {
  it("returns ok from the health endpoint", async () => {
    const app = createApp();

    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });
});

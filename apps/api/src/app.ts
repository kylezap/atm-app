import cors from "cors";
import express from "express";
import type { NextFunction, Request, Response } from "express";

import { createPinApiClient } from "./clients/pin-api-client";
import { createInitialInventory } from "./domain/atm-inventory";
import { createNoteDispenser } from "./domain/note-dispenser";
import { HttpError } from "./lib/http-error";
import { createAtmRoutes } from "./routes/atm-routes";
import { healthRoutes } from "./routes/health-routes";
import { createAtmOrchestrator } from "./services/app-orchestrator";
import { createPinService } from "./services/pin-service";
import { createWithdrawalService } from "./services/withdrawal-service";

export function createApp() {
  const app = express();

  const pinApiClient = createPinApiClient();
  const pinService = createPinService(pinApiClient);
  const inventory = createInitialInventory();
  const noteDispenser = createNoteDispenser();
  const withdrawalService = createWithdrawalService({
    inventory,
    noteDispenser,
  });
  const orchestrator = createAtmOrchestrator({
    pinService,
    withdrawalService,
  });

  app.use(cors());
  app.use(express.json());

  app.use("/api/health", healthRoutes);
  app.use("/api/atm", createAtmRoutes(orchestrator));

  app.use((_request: Request, response: Response) => {
    response.status(404).json({ message: "Route not found." });
  });

  app.use(
    (
      error: unknown,
      _request: Request,
      response: Response,
      _next: NextFunction,
    ) => {
      if (error instanceof HttpError) {
        response.status(error.statusCode).json({ message: error.message });
        return;
      }

      response.status(500).json({ message: "Internal server error." });
    },
  );

  return app;
}

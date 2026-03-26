import { Router } from "express";

import { createAtmController } from "../controllers/atm-controller";
import type { PinService } from "../services/pin-service";
import type { AtmOrchestrator } from "../types/atm";

export function createAtmRoutes(
  orchestrator: AtmOrchestrator,
  pinService: PinService,
) {
  const router = Router();
  const controller = createAtmController(orchestrator, pinService);

  router.post("/pin", controller.verifyPin);
  router.post("/session", controller.createSession);
  router.post("/reset", controller.resetSession);

  return router;
}

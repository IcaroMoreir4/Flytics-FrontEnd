// src/routes/flights.ts
import { Router } from "express";
import { searchFlights } from "../controllers/flightsController";
import { getAirports } from "../controllers/airportsController";
import { getHistory } from "../controllers/historyController";

const router = Router();

router.get("/", searchFlights);
router.get("/airports", getAirports);
router.get("/history", getHistory);

export default router;

import { Router } from "express";
import { getFlights, getAirports } from "../controllers/flightsController";

const router = Router();

router.get("/", getFlights);
router.get("/airports", getAirports);

export default router;

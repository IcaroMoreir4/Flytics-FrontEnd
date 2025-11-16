// src/controllers/flightsController.ts

import { Request, Response } from "express";
import { predictFare } from "../services/flightMLService";

export const searchFlights = async (req: Request, res: Response) => {
  try {
    const { origin, destination, departure, return: returnDate } = req.query;

    if (!origin || !destination || !departure) {
      return res.status(400).json({ message: "Parâmetros incompletos." });
    }

    const results: any[] = [];

    // --- Predição de IDA
    const idaPrediction = await predictFare({
      empresa: "AZU", // TODO: escolher via front futuramente
      origem: String(origin),
      destino: String(destination),
      mes: new Date(String(departure)).getMonth() + 1,
      ano: new Date(String(departure)).getFullYear(),
    });

    results.push({
      origin,
      destination,
      date: departure,
      type: "ida",
      price: idaPrediction.predicted_tarifa,
      error: idaPrediction.predicted_tarifa ? null : "Erro na previsão"
    });

    // --- Predição de VOLTA
    if (returnDate) {
      const voltaPrediction = await predictFare({
        empresa: "AZU",
        origem: String(destination),
        destino: String(origin),
        mes: new Date(String(returnDate)).getMonth() + 1,
        ano: new Date(String(returnDate)).getFullYear(),
      });

      results.push({
        origin: destination,
        destination: origin,
        date: returnDate,
        type: "volta",
        price: voltaPrediction.predicted_tarifa,
        error: voltaPrediction.predicted_tarifa ? null : "Erro na previsão"
      });
    }

    res.json(results);
  } catch (err) {
    console.error("Erro no searchFlights:", err);
    res.status(500).json({ message: "Erro ao buscar voos." });
  }
};

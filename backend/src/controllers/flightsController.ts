import type { Request, Response } from "express";
import mockFlights from "../data/mockFlights.json";
import airports from "../data/airports.json";

// 🔹 Gera variações de preço e data (agora com base na data de ida/volta)
function generateFlightVariations(
  origin: string,
  destination: string,
  departureDate?: Date,
  returnDate?: Date
) {
  const baseFlights = mockFlights.filter(
    f => f.origin === origin && f.destination === destination
  );

  const base = baseFlights.length ? baseFlights : mockFlights;
  const variations: any[] = [];

  // 🔸 Gera voos próximos da data de ida
  if (departureDate) {
    base.forEach((f) => {
      const date = new Date(departureDate);
      const offsetDays = Math.floor(Math.random() * 5); // até +5 dias
      date.setDate(date.getDate() + offsetDays);

      const price = Math.round(f.price * (0.8 + Math.random() * 0.4));
      variations.push({
        ...f,
        type: "ida",
        date: date.toISOString().split("T")[0],
        price
      });
    });
  }

  // 🔸 Gera voos próximos da data de volta (se existir)
  if (returnDate) {
    base.forEach((f) => {
      const date = new Date(returnDate);
      const offsetDays = Math.floor(Math.random() * 5); // até +5 dias
      date.setDate(date.getDate() + offsetDays);

      const price = Math.round(f.price * (0.8 + Math.random() * 0.4));
      variations.push({
        ...f,
        type: "volta",
        date: date.toISOString().split("T")[0],
        price
      });
    });
  }

  // Ordena por data
  return variations.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

// 🔹 Endpoint principal: /api/flights
export const getFlights = (req: Request, res: Response) => {
  const { origin, destination, departure, return: returnDate } = req.query;

  const results = generateFlightVariations(
    String(origin),
    String(destination),
    departure ? new Date(departure as string) : undefined,
    returnDate ? new Date(returnDate as string) : undefined
  );

  res.json(results);
};

// 🔹 Endpoint de aeroportos
export const getAirports = (req: Request, res: Response) => {
  try {
    const withIata = (airports as any[]).filter(
      (a) => a.iata_code && a.name && a.city && a.country
    );
    res.json(withIata);
  } catch (error) {
    console.error("Erro ao carregar aeroportos:", error);
    res.status(500).json({ message: "Erro ao carregar aeroportos" });
  }
};

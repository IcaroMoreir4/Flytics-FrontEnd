import { Request, Response } from "express";
import path from "path";
import fs from "fs";

export const getHistory = (req: Request, res: Response) => {
  const { origin, destination } = req.query;

  try {
    const dataPath = path.join(__dirname, "../data/historico_precos.json");
    const raw = fs.readFileSync(dataPath, "utf-8");
    const dataset = JSON.parse(raw);

    const rota = dataset.find(
      (r: any) => r.origin === origin && r.destination === destination
    );

    if (!rota) {
      return res.json({
        min_historic: null,
        max_historic: null
      });
    }

    let min_historic = rota.min_price;
    let max_historic = rota.max_price;

    // 🔥 Filtro anti-valores irreais
    if (min_historic < 100) min_historic = null;
    if (max_historic < 100) max_historic = null;

    return res.json({ min_historic, max_historic });

  } catch (e) {
    console.error("Erro histórico:", e);
    return res.status(500).json({ message: "Erro ao carregar histórico" });
  }
};

// src/controllers/airportsController.ts

import { Request, Response } from "express";
import fs from "fs";
import path from "path";

export const getAirports = (req: Request, res: Response) => {
  try {
    // 1. Carrega categorical_info.json
    const catPath = path.join(__dirname, "../data/categorical_info.json");
    const rawCat = fs.readFileSync(catPath, "utf-8");
    const cat = JSON.parse(rawCat);

    // 2. Carrega CSV real da ANAC
    const airportsCsvPath = path.join(__dirname, "../data/cadastro_aerodromos.csv");
    const csvRaw = fs.readFileSync(airportsCsvPath, "utf-8");

    const csvLines = csvRaw.split(/\r?\n/);
    const header = csvLines[0].split(";");

    // ============== CORREÇÃO DO CABEÇALHO ==============
    function findColumn(possibilities: string[]) {
      for (const p of possibilities) {
        const idx = header.findIndex(h => h.trim().toUpperCase() === p.toUpperCase());
        if (idx !== -1) return idx;
      }
      return -1;
    }

    const idxCodigo = findColumn(["CÓDIGO OACI", "CODIGO OACI", "ÓDIGO OACI", "OACI"]);
    const idxMunicipio = findColumn(["MUNICÍPIO ATENDIDO", "MUNICIPIO ATENDIDO", "MUNICIPIO", "MUNICÍPIO"]);

    if (idxCodigo === -1 || idxMunicipio === -1) {
      console.error("❌ Não foi possível identificar colunas no CSV da ANAC.");
      console.error("Cabeçalho lido:", header);
      return res.status(500).json({ message: "Cabeçalho do CSV inválido." });
    }

    // ============== Construção do mapa OACI → Cidade ==============
    const mapa: Record<string, string> = {};

    for (let i = 1; i < csvLines.length; i++) {
      const cols = csvLines[i].split(";");
      const cod = cols[idxCodigo]?.trim();
      const nome = cols[idxMunicipio]?.trim();

      if (cod && nome) {
        mapa[cod.toUpperCase()] = nome.toUpperCase();
      }
    }

    // ============== Construção da lista final ==============
    const airports: any[] = [];

    function addAirport(code: string) {
      const upper = code.toUpperCase();
      const cityName = mapa[upper] || upper;
      return {
        code: upper,
        name: cityName,
        iata_code: upper.slice(1, 4).toUpperCase(),
        country: "Brasil"
      };
    }

    for (const o of cat.origens) airports.push(addAirport(o));

    for (const d of cat.destinos) {
      if (!airports.find(a => a.code === d)) airports.push(addAirport(d));
    }

    return res.json(airports);
  } catch (err) {
    console.error("Erro ao carregar aeroportos:", err);
    return res.status(500).json({ message: "Erro ao carregar aeroportos" });
  }
};

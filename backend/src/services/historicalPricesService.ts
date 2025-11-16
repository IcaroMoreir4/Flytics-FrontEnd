import fs from "fs";
import path from "path";

type HistoricalRecord = {
  origem: string;
  destino: string;
  tarifa: number;
};

let cache: HistoricalRecord[] | null = null;

function loadAllHistorical(): HistoricalRecord[] {
  if (cache) return cache;

  // Caminho ABSOLUTO para: PI_Big_DATA_2025.2/flytics/dataset
  const datasetRoot = path.resolve(
    process.cwd(),
    "..",
    "flytics",
    "dataset"
  );

  console.log("📂 Lendo histórico em:", datasetRoot);

  const years = ["2023", "2024", "2025"];
  const records: HistoricalRecord[] = [];

  for (const year of years) {
    const yearDir = path.join(datasetRoot, year);
    if (!fs.existsSync(yearDir)) continue;

    const files = fs.readdirSync(yearDir).filter((f) => f.endsWith(".CSV"));

    for (const file of files) {
      const fullPath = path.join(yearDir, file);
      console.log("📑 Lendo arquivo:", fullPath);

      const content = fs.readFileSync(fullPath, "utf-8");
      const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length <= 1) continue;

      const header = lines[0].split(";");
      const idxOrigem = header.indexOf("ORIGEM");
      const idxDestino = header.indexOf("DESTINO");
      const idxTarifa = header.indexOf("TARIFA");

      if (idxOrigem === -1 || idxDestino === -1 || idxTarifa === -1) {
        console.warn(`⚠️ Cabeçalho inesperado em ${fullPath}:`, header);
        continue;
      }

      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(";");
        if (parts.length <= idxTarifa) continue;

        const origem = (parts[idxOrigem] || "").trim().toUpperCase();
        const destino = (parts[idxDestino] || "").trim().toUpperCase();
        const tarifaRaw = (parts[idxTarifa] || "").trim();

        if (!origem || !destino || !tarifaRaw) continue;

        // 👉 TRATAMENTO BR: remove separador de milhar e ajusta decimal
        let tarifaStr = tarifaRaw;
        tarifaStr = tarifaStr.replace(/\./g, ""); // remove todos os pontos
        tarifaStr = tarifaStr.replace(",", ".");  // vírgula vira ponto

        const tarifa = Number(tarifaStr);
        if (Number.isNaN(tarifa)) {
          // debug opcional:
          // console.log("💥 Tarifa inválida:", tarifaRaw, "=>", tarifaStr);
          continue;
        }

        records.push({ origem, destino, tarifa });
      }
    }
  }

  cache = records;
  console.log(`✅ Histórico carregado: ${records.length} linhas válidas.`);
  return cache;
}

export function getMinTarifa(origin: string, destination: string): number | null {
  const data = loadAllHistorical();

  const o = origin.toUpperCase();
  const d = destination.toUpperCase();

  let min: number | null = null;
  let count = 0;

  for (const rec of data) {
    if (rec.origem === o && rec.destino === d) {
      count++;
      if (min === null || rec.tarifa < min) min = rec.tarifa;
    }
  }

  console.log(
    `🔎 getMinTarifa(${o} -> ${d}) => matches: ${count}, min:`,
    min
  );

  return min;
}

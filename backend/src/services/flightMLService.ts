// src/services/flightMLService.ts

import axios from "axios";

const PYTHON_API = process.env.PYTHON_API_URL || "http://localhost:5000";

export async function predictFare(input: {
  empresa: string;
  origem: string;
  destino: string;
  mes: number;
  ano: number;
}) {
  const response = await axios.post(`${PYTHON_API}/predict`, input);
  return response.data;
}

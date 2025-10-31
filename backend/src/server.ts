import express from "express";
import cors from "cors";
import flightsRouter from "./routes/flights";

const app = express();

app.use(cors());
app.use(express.json());

// 🔹 Rota principal da API
app.use("/api/flights", flightsRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

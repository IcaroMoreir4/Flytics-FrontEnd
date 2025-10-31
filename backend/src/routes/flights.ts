import { Router } from "express";
const router = Router();

// ✅ Test route
router.get("/test", (req, res) => {
  res.json({ message: "✅ Backend funcionando!" });
});

// Exemplo de rota POST (opcional)
router.post("/search", (req, res) => {
  const { origin, destination } = req.body;
  res.json({ result: `Buscando voos de ${origin} para ${destination}` });
});

export default router;

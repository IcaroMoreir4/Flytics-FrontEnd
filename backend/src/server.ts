import express from "express";
import routes from "./routes/flights";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/flights", routes);

app.listen(3001, () => {
  console.log("Backend running on port 3001");
});

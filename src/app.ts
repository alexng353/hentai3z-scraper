import logger from "./utils/logger";

import express from "express";
import cors from "cors";

const app = express();

const corsOptions = {
  origin: "*",
};

app.use(cors(corsOptions));

app.use("/images", express.static("images"));

app.use("/compressed", express.static("output"));

app.get("/images", (req, res) => {
  res.status(404).json({ message: "Not found" });
});

app.listen(3000, () => {
  logger.info("Server listening on port 3000");
});

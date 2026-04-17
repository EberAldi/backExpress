import "dotenv/config";
import express from "express";
import { AppDataSource } from "./data-source.js";
import cors from 'cors'
import userRoutes from "./user/user.controller.js";
import authRoutes from "./auth/auth.controller.js";

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

AppDataSource.initialize()
  .then(() => {
    console.log("DB conectada");

    app.use(cors())
    app.use("/api", userRoutes);
    app.use("/api", authRoutes);

    app.listen(PORT, () => {
      console.log(`Servidor en http://localhost:${PORT}`);
    });
    
  })
  .catch(console.error);
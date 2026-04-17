require("dotenv").config();

import express, { json } from "express";
import { AppDataSource } from "./data-source";

import userRoutes from "./user/user.controller";
import authRoutes from "./auth/auth.controller";

const app = express();
app.use(json());

const PORT = process.env.PORT || 3000;

AppDataSource.initialize()
  .then(() => {
    console.log("DB conectada");

    app.use("/api", userRoutes);
    app.use("/api", authRoutes);

    app.listen(PORT, () => {
      console.log(`Servidor en http://localhost:${PORT}`);
    });
  })
  .catch((error) => console.log(error));
import "dotenv/config";
import express from "express";
import { AppDataSource } from "./data-source.js";
import cors from 'cors'
import userRoutes from "./user/user.controller.js";
import authRoutes from "./auth/auth.controller.js";
import controlRoutes from "./controles/control.controller.js";
import consolaRoutes from "./consolas/consola.controller.js";
import sesionRoutes from "./sesion/sesion.controller.js"
import productoRoutes from "./productos/productos.controller.js";
import ventaRoutes from "./ventas/ventas.controller.js";
import passport from "./auth/google.strategy.js";


const app = express();

app.use(express.json());
app.use(passport.initialize());
 

const PORT = process.env.PORT || 3000;

AppDataSource.initialize()
  .then(() => {
    console.log("DB conectada");

    app.use(cors())
    app.use("/auth",      authRoutes);
app.use("/consolas",  consolaRoutes);
app.use("/controles", controlRoutes);
app.use("/users",     userRoutes);
app.use("/sesiones",  sesionRoutes);
app.use("/productos", productoRoutes);
app.use("/ventas",    ventaRoutes);


    app.listen(PORT, () => {
      console.log(`Servidor en http://localhost:${PORT}`);
    });
    
  })
  .catch(console.error);
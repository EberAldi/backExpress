import "dotenv/config";
import express from "express";
import { AppDataSource } from "./data-source.js";
import cors from "cors";
import morgan from "morgan";
import { auth } from "express-openid-connect";

import userRoutes from "./user/user.controller.js";
import authRoutes from "./auth/auth.controller.js";
import controlRoutes from "./controles/control.controller.js";
import consolaRoutes from "./consolas/consola.controller.js";
import sesionRoutes from "./sesion/sesion.controller.js";
import productoRoutes from "./productos/productos.controller.js";
import ventaRoutes from "./ventas/ventas.controller.js";
import juegoRoutes from "./juegos/juegos.controller.js";
import pagosRoutes from "./routes/pagos.routes.js"
import pagoRoutes from "./pago/pago.controller.js"
import clienteRoutes from "./cliente/cliente.controller.js"
import configuracionRoutes from "./configuracion/configuracion.controller.js"
import reservacionRoutes from "./reservacion/reservacion.controller.js"
import promocionRoutes from "./promocion/promocion.controller.js"
import dashboardRoutes from "./dashboard/dashboard.controller.js";
import passport from "./auth/google.strategy.js";

import {
  autoCerrarSesiones,
  checarReservacionesProximas,
} from "./sesion/sesion.service.js";

const app = express();

app.use(express.json());
app.use(cors());
app.use(morgan("dev"));

// Auth0 — solo se activa si todas las variables están presentes
// Las rutas /api/auth/login y /api/auth/cliente/login siempre son públicas
const auth0Configurado =
  process.env.CLIENT_ID &&
  process.env.ISSUER_BASE_URL &&
  process.env.SECRET &&
  process.env.BASE_URL;

if (auth0Configurado) {
  app.use(
    auth({
      authRequired: false,   // nunca bloquea rutas por defecto
      auth0Logout: true,
      secret: process.env.SECRET,
      baseURL: process.env.BASE_URL,
      clientID: process.env.CLIENT_ID,
      issuerBaseURL: process.env.ISSUER_BASE_URL,
    })
  );
}

app.use(passport.initialize());

const PORT = process.env.PORT || 3000;

AppDataSource.initialize()
  .then(() => {

    console.log("DB conectada");

    app.use("/api/auth", authRoutes);
    app.use("/api/consolas", consolaRoutes);
    app.use("/api/controles", controlRoutes);
    app.use("/api/users", userRoutes);
    app.use("/api/sesiones", sesionRoutes);
    app.use("/api/productos", productoRoutes);
    app.use("/api/ventas", ventaRoutes);
    app.use("/api/juegos", juegoRoutes);
    app.use("/api/dashboard", dashboardRoutes);
    app.use("/api/clientes", clienteRoutes);
    app.use("/api/configuraciones", configuracionRoutes);
    app.use("/api/reservaciones", reservacionRoutes);
    app.use("/api/promociones", promocionRoutes);
    app.use("/api/pagos", pagosRoutes);
    app.use("/api/pagos", pagoRoutes);

    // AUTO CIERRE + AVISOS
    setInterval(async () => {
      try {
        await autoCerrarSesiones();
      } catch (error) {
        console.error("Error autocierre:", error);
      }
    }, 30000);

    setInterval(async () => {
      try {
        await checarReservacionesProximas();
      } catch (error) {
        console.error("Error checar reservaciones próximas:", error);
      }
    }, 60000);

    app.listen(PORT, () => {

      console.log(
        `Servidor en http://localhost:${PORT}`
      );
    });

  })
  .catch(console.error);
import "reflect-metadata";
import dotenv from "dotenv";
import { DataSource } from "typeorm";
import User from "./user/entity/User.js";
import Consola from "./consolas/entities/consola.js";
import Control from "./controles/entities/control.js";
import Sesion from "./sesion/entites/sesion.js";
import Producto from "./productos/entites/producto.js";
import Venta from "./ventas/entites/ventas.js";
import detalleVenta from "./detalleVenta/entites/detalleVenta.js";
import Juego from "./juegos/entites/juego.js";

dotenv.config();

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: true,
  logging: false,
  entities: [User,Consola,Control,Sesion,Producto,Venta,detalleVenta,Juego],
});
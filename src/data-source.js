import "reflect-metadata";
require("dotenv").config();

const { AppDataSource } = require("./data-source");
import {User} from "./user/entity/User"

const AppDataSource = new AppDataSource({
  type: "postgres",
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: true,
  logging: false,
  entities: [User],
});

export default {
  AppDataSource,
};
import { EntitySchema } from "typeorm";

const Consola = new EntitySchema({
  name: "Consola",
  tableName: "consolas",
  columns: {
    id: {
      primary: true,
      type: "int",
      generated: true,
    },
    nombre: {
      type: "varchar",
    },
    marca: {
      type: "varchar",
    },
    estado: {
      type: "enum",
      enum: ["disponible", "ocupada", "mantenimiento"],
      default: "disponible",
    },
    precioPorHora: {
      type: "int",
    },
    usoHoy: {
      type: "int",
      default: 0,
    },
  },
  relations: {
    controles: {
      type: "one-to-many",
      target: "Control",
      inverseSide: "consola",
      eager: true,
    },
  },
});

export default Consola;
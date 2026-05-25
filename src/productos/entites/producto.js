import { EntitySchema } from "typeorm";

const Producto = new EntitySchema({
  name: "Producto",
  tableName: "productos",
  columns: {
    id: {
      primary: true,
      type: "int",
      generated: true,
    },
    nombre: {
      type: "varchar",
    },
    precio: {
      type: "decimal",
      precision: 10,
      scale: 2,
    },
    stock: {
      type: "int",
      default: 0,
    },
    categoria: {
      type: "enum",
      enum: ["comida", "bebida", "accesorio"],
    },
    costoEnPuntos: {
      type: "int",
      nullable: true,
      default: null,
    },
    disponibleConPuntos: {
      type: "boolean",
      default: false,
    },
  },
  relations: {
    detalles: {
      type: "one-to-many",
      target: "DetalleVenta",
      inverseSide: "producto",
    },
  },
});

export default Producto;
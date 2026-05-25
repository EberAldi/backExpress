import { EntitySchema } from "typeorm";

export default new EntitySchema({
  name: "HistorialPuntos",
  tableName: "historial_puntos",
  columns: {
    id: { primary: true, type: "uuid", generated: "uuid" },
    clienteId: { type: "uuid" },
    puntos: { type: "int" },
    tipo: {
      type: "enum",
      enum: ["sesion", "pago", "venta", "canje"],
    },
    descripcion: { type: "varchar" },
    saldoAnterior: { type: "int" },
    saldoNuevo: { type: "int" },
    creadoEn: { type: "timestamp", default: () => "CURRENT_TIMESTAMP" },
  },
  relations: {
    cliente: {
      type: "many-to-one",
      target: "Cliente",
      joinColumn: { name: "clienteId" },
      onDelete: "CASCADE",
    },
  },
});

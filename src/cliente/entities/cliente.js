import { EntitySchema } from "typeorm";

export default new EntitySchema({
  name: "Cliente",
  tableName: "clientes",
  columns: {
    id: { primary: true, type: "uuid", generated: "uuid" },
    nombre: { type: "varchar" },
    telefono: { type: "varchar", nullable: true },
    email: { type: "varchar", nullable: true },
    fechaNacimiento: { type: "date", nullable: true },
    puntosAcumulados: { type: "int", default: 0 },
    descuentoActual: { type: "decimal", precision: 5, scale: 2, default: 0 },
    // Auditoría
    creadoEn: { type: "timestamp", default: () => "CURRENT_TIMESTAMP" },
    actualizadoEn: { type: "timestamp", default: () => "CURRENT_TIMESTAMP", onUpdate: "CURRENT_TIMESTAMP" },
    eliminadoEn: { type: "timestamp", nullable: true },
    isActive: { type: "boolean", default: true }
  },
  relations: {
    sesiones: {
      type: "one-to-many",
      target: "Sesion",
      inverseSide: "cliente"
    },
    reservaciones: {
      type: "one-to-many",
      target: "Reservacion",
      inverseSide: "cliente"
    }
  }
});
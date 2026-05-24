import { EntitySchema } from "typeorm";
export default new EntitySchema({
  name: "Reservacion",
  tableName: "reservaciones",
  columns: {
    id: { primary: true, type: "uuid", generated: "uuid" },
    fechaInicio: { type: "timestamp" },
    fechaFin: { type: "timestamp" },
    duracionHoras: { type: "int" },
    estado: {
      type: "enum",
      enum: ["pendiente", "confirmada", "activa", "completada", "cancelada", "no_show"],
      default: "pendiente"
    },
    // Políticas
    requiereAnticipo: { type: "boolean", default: false },
    montoAnticipo: { type: "decimal", precision: 10, scale: 2, nullable: true },
    // Referencias
    clienteId: { type: "uuid" },
    consolaId: { type: "int" },
    empleadoId: { type: "int" }, // quien la creó
    // Auditoría
    creadoEn: { type: "timestamp", default: () => "CURRENT_TIMESTAMP" },
    canceladoEn: { type: "timestamp", nullable: true },
    motivoCancelacion: { type: "text", nullable: true },
    notas: { type: "text", nullable: true }
  },
  relations: {
    cliente: {
      type: "many-to-one",
      target: "Cliente",
      joinColumn: { name: "clienteId" },
      onDelete: "RESTRICT"
    },
    consola: {
      type: "many-to-one",
      target: "Consola",
      joinColumn: { name: "consolaId" },
      onDelete: "RESTRICT"
    },
    empleado: {
      type: "many-to-one",
      target: "User",
      joinColumn: { name: "empleadoId" }
    },
    sesion: {
      type: "one-to-one",
      target: "Sesion",
      inverseSide: "reservacion",
      nullable: true
    }
  }
});
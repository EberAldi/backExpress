import { EntitySchema } from "typeorm";
export default new EntitySchema({
  name: "Pago",
  tableName: "pagos",
  columns: {
    id: { primary: true, type: "uuid", generated: "uuid" },
    monto: { type: "decimal", precision: 10, scale: 2 },
    metodoPago: {
      type: "enum",
      enum: ["efectivo", "tarjeta", "transferencia", "mercadopago", "mixto"]
    },
    estado: {
      type: "enum",
      enum: ["pendiente", "procesando", "completado", "fallido", "reembolsado", "APRO"]
    },
    // Mercado Pago
    mpPreferenceId: { type: "varchar", nullable: true },
    mpPaymentId: { type: "varchar", nullable: true },
    mpStatus: { type: "varchar", nullable: true },
    // Referencias
    sesionId: { type: "int", nullable: true },
    reservacionId: { type: "uuid", nullable: true },
    ventaId: { type: "int", nullable: true },
    // Auditoría
    creadoEn: { type: "timestamp", default: () => "CURRENT_TIMESTAMP" },
    procesadoEn: { type: "timestamp", nullable: true }
  },
  relations: {
    sesion: {
      type: "many-to-one",
      target: "Sesion",
      joinColumn: { name: "sesionId" },
      nullable: true,
      onDelete: "SET NULL",
    },
    reservacion: {
      type: "many-to-one",
      target: "Reservacion",
      joinColumn: { name: "reservacionId" },
      nullable: true,
      onDelete: "SET NULL",
    },
    venta: {
      type: "many-to-one",
      target: "Venta",
      joinColumn: { name: "ventaId" },
      nullable: true,
      onDelete: "SET NULL",
    },
  }
});
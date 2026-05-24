import { EntitySchema } from "typeorm";
export default new EntitySchema({
  name: "Promocion",
  tableName: "promociones",
  columns: {
    id: { primary: true, type: "uuid", generated: "uuid" },
    nombre: { type: "varchar" },
    descripcion: { type: "text" },
    tipo: {
      type: "enum",
      enum: ["descuento_porcentaje", "descuento_fijo", "2x1", "happy_hour", "paquete_horas"]
    },
    valor: { type: "decimal", precision: 10, scale: 2 },
    // Condiciones
    diasSemana: { type: "jsonb" }, // ["lunes", "viernes"]
    horaInicio: { type: "time", nullable: true },
    horaFin: { type: "time", nullable: true },
    fechaInicio: { type: "date" },
    fechaFin: { type: "date" },
    aplicaSoloMembresía: { type: "boolean", default: false },
    activo: { type: "boolean", default: true }
  }
});
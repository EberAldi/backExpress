import { EntitySchema } from "typeorm";

export default new EntitySchema({
  name: "Configuracion",
  tableName: "configuraciones",
  columns: {
    id: { primary: true, type: "uuid", generated: "uuid" },
    tipo: {
      type: "enum",
      enum: ["precio_hora", "happy_hour", "politica_cancelacion", "horario_operacion", "promocion"]
    },
    nombre: { type: "varchar" },
    // Flexibilidad con JSONB
    configuracion: { type: "jsonb" },
    // Ejemplo: { "precio": 50, "dias": ["lunes", "martes"], "horaInicio": "14:00", "horaFin": "18:00" }
    activo: { type: "boolean", default: true },
    creadoEn: { type: "timestamp", default: () => "CURRENT_TIMESTAMP" }
  }
});
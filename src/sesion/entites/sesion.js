import { EntitySchema } from "typeorm";

const Sesion = new EntitySchema({
  name: "Sesion",
  tableName: "sesiones",
  columns: {
    id: {
      primary: true,
      type: "int",
      generated: true,
    },
    inicio: {
      type: "timestamp",
      default: () => "CURRENT_TIMESTAMP",
    },
    fin: {
      type: "timestamp",
      nullable: true,
    },
    totalMinutos: {
      type: "int",
      nullable: true,
    },
    costoConsola: {
      type: "decimal",
      precision: 10,
      scale: 2,
      nullable: true,
    },
    estado: {
      type: "enum",
      enum: ["activa", "cerrada"],
      default: "activa",
    },
    consolaId: {
      type: "int",
    },
    empleadoId: {
      type: "int",
    },
    pagoEstado: {
  type: "enum",
  enum: ["pendiente", "pagado", "efectivo"],
  default: "pendiente",
},
mpPreferenceId: {
  type: "varchar",
  nullable: true,   // se llena cuando generan el link de pago
},
  },
  relations: {
    consola: {
      type: "many-to-one",
      target: "Consola",
      joinColumn: { name: "consolaId" },
      onDelete: "RESTRICT",
    },
    empleado: {
      type: "many-to-one",
      target: "User",
      joinColumn: { name: "empleadoId" },
      onDelete: "RESTRICT",
    },
    ventas: {
      type: "one-to-many",
      target: "Venta",
      inverseSide: "sesion",
    },
  },
});

export default Sesion;
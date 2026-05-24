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

    // NUEVO
    duracionHoras: {
      type: "int",
      default: 1,
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

    juegoId: {
      type: "int",
      nullable: true,
    },

    pagoEstado: {
      type: "enum",
      enum: ["pendiente", "pagado", "efectivo"],
      default: "pendiente",
    },

    clienteId: { type: "uuid" }, // CRÍTICO
reservacionId: { type: "uuid", nullable: true },
turnoId: { type: "uuid", nullable: true },
precioHoraAplicado: { type: "decimal", precision: 10, scale: 2 }, // guardar precio histórico
configuracionAplicadaId: { type: "uuid", nullable: true }, // qué promoción se 
  },

  relations: {
    pagos: {
  type: "one-to-many",
  target: "Pago",
  inverseSide: "sesion"
},
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

    juego: {
      type: "many-to-one",
      target: "Juego",
      joinColumn: { name: "juegoId" },
      onDelete: "SET NULL",
    },
  },
});

export default Sesion;
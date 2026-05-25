import { EntitySchema } from "typeorm";

const Venta = new EntitySchema({
  name: "Venta",
  tableName: "ventas",
  columns: {
    id: {
      primary: true,
      type: "int",
      generated: true,
    },
    total: {
      type: "decimal",
      precision: 10,
      scale: 2,
    },
    creadoEn: {
      type: "timestamp",
      default: () => "CURRENT_TIMESTAMP",
    },
    empleadoId: {
      type: "int",
      nullable: true,
    },
    sesionId: {
      type: "int",
      nullable: true,
    },
    descuento: {
      type: "decimal",
      precision: 10,
      scale: 2,
      default: 0,
    },
    promocionId: {
      type: "uuid",
      nullable: true,
    },
    puntosUsados: {
      type: "int",
      default: 0,
    },
    canjeToken: {
      type: "varchar",
      nullable: true,
      unique: true,
    },
    canjeCodigo: {
      type: "varchar",
      length: 8,
      nullable: true,
      unique: true,
    },
    canjeado: {
      type: "boolean",
      default: false,
    },
    canjeadoEn: {
      type: "timestamp",
      nullable: true,
    },
  },
  relations: {
    empleado: {
      type: "many-to-one",
      target: "User",
      joinColumn: { name: "empleadoId" },
      onDelete: "RESTRICT",
    },
    sesion: {
      type: "many-to-one",
      target: "Sesion",
      joinColumn: { name: "sesionId" },
      nullable: true,
      onDelete: "SET NULL",
    },
    detalles: {
      type: "one-to-many",
      target: "DetalleVenta",
      inverseSide: "venta",
      eager: true,
    },
    pagos: {
      type: "one-to-many",
      target: "Pago",
      inverseSide: "venta",
    },
  },
});

export default Venta;
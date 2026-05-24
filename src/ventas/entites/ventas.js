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
      eager: true,  // siempre cargar detalles con la venta
    },
  },
});

export default Venta;
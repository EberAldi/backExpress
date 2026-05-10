import { EntitySchema } from "typeorm";

const DetalleVenta = new EntitySchema({
  name: "DetalleVenta",
  tableName: "detalle_ventas",
  columns: {
    id: {
      primary: true,
      type: "int",
      generated: true,
    },
    cantidad: {
      type: "int",
    },
    precioUnitario: {
      type: "decimal",
      precision: 10,
      scale: 2,
    },
    subtotal: {
      type: "decimal",
      precision: 10,
      scale: 2,
    },
    ventaId: {
      type: "int",
    },
    productoId: {
      type: "int",
    },
  },
  relations: {
    venta: {
      type: "many-to-one",
      target: "Venta",
      joinColumn: { name: "ventaId" },
      onDelete: "CASCADE",  // si se borra la venta, se van sus detalles
    },
    producto: {
      type: "many-to-one",
      target: "Producto",
      joinColumn: { name: "productoId" },
      onDelete: "RESTRICT",
    },
  },
});

export default DetalleVenta;
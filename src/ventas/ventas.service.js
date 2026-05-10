import { AppDataSource } from "../data-source.js";

const repo = () => AppDataSource.getRepository("Venta");
const detalleRepo = () => AppDataSource.getRepository("DetalleVenta");
const productoRepo = () => AppDataSource.getRepository("Producto");

export async function getAll() {
  return repo().find({ relations: ["empleado", "sesion", "detalles", "detalles.producto"] });
}

export async function getById(id) {
  const venta = await repo().findOne({
    where: { id },
    relations: ["empleado", "sesion", "detalles", "detalles.producto"],
  });
  if (!venta) throw { status: 404, message: "Venta no encontrada" };
  return venta;
}

export async function getBySesion(sesionId) {
  return repo().find({
    where: { sesionId },
    relations: ["detalles", "detalles.producto"],
  });
}

/*
  body esperado:
  {
    empleadoId: 1,
    sesionId: 3,          // opcional
    items: [
      { productoId: 1, cantidad: 2 },
      { productoId: 4, cantidad: 1 }
    ]
  }
*/
export async function create({ empleadoId, sesionId = null, items }) {
  if (!items || items.length === 0) {
    throw { status: 400, message: "La venta debe tener al menos un producto" };
  }

  // Usar transacción para que si falla algo todo se revierta
  return AppDataSource.transaction(async (manager) => {
    let total = 0;
    const detalles = [];

    for (const item of items) {
      const producto = await manager.findOne("Producto", { where: { id: item.productoId } });
      if (!producto) throw { status: 404, message: `Producto ${item.productoId} no encontrado` };
      if (producto.stock < item.cantidad) {
        throw { status: 400, message: `Stock insuficiente para "${producto.nombre}"` };
      }

      const subtotal = parseFloat((producto.precio * item.cantidad).toFixed(2));
      total += subtotal;

      detalles.push({
        productoId: item.productoId,
        cantidad: item.cantidad,
        precioUnitario: producto.precio,  // snapshot del precio actual
        subtotal,
      });

      // Descontar stock
      await manager.update("Producto", item.productoId, {
        stock: producto.stock - item.cantidad,
      });
    }

    // Guardar venta
    const venta = manager.create("Venta", {
      empleadoId,
      sesionId,
      total: parseFloat(total.toFixed(2)),
    });
    const ventaGuardada = await manager.save("Venta", venta);

    // Guardar detalles
    const detallesConVenta = detalles.map((d) => ({ ...d, ventaId: ventaGuardada.id }));
    await manager.save("DetalleVenta", detallesConVenta);

    // Regresar venta completa
    return manager.findOne("Venta", {
      where: { id: ventaGuardada.id },
      relations: ["detalles", "detalles.producto"],
    });
  });
}

export async function remove(id) {
  const venta = await getById(id);
  // Los detalles se eliminan en cascada (CASCADE en la entidad)
  return repo().remove(venta);
}
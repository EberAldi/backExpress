import { AppDataSource } from "../data-source.js";

const repo = () => AppDataSource.getRepository("Venta");

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
    promocionId: "uuid",  // opcional — aplica descuento al total
    items: [
      { productoId: 1, cantidad: 2 },
      { productoId: 4, cantidad: 1 }
    ]
  }
*/
export async function create({ empleadoId, sesionId = null, items, promocionId = null }) {
  if (!items || items.length === 0) {
    throw { status: 400, message: "La venta debe tener al menos un producto" };
  }

  return AppDataSource.transaction(async (manager) => {
    let subtotalBruto = 0;
    const detalles = [];

    for (const item of items) {
      const producto = await manager.findOne("Producto", { where: { id: item.productoId } });
      if (!producto) throw { status: 404, message: `Producto ${item.productoId} no encontrado` };
      if (producto.stock < item.cantidad) {
        throw { status: 400, message: `Stock insuficiente para "${producto.nombre}"` };
      }

      const subtotal = parseFloat((producto.precio * item.cantidad).toFixed(2));
      subtotalBruto += subtotal;

      detalles.push({
        productoId: item.productoId,
        cantidad: item.cantidad,
        precioUnitario: producto.precio,
        subtotal,
      });

      await manager.update("Producto", item.productoId, {
        stock: producto.stock - item.cantidad,
      });
    }

    // aplicar promoción si viene
    let descuento = 0;
    if (promocionId) {
      const promocion = await manager.findOne("Promocion", {
        where: { id: promocionId, activo: true },
      });
      if (!promocion) throw { status: 404, message: "Promoción no encontrada o inactiva" };

      const hoy = new Date();
      if (hoy < new Date(promocion.fechaInicio) || hoy > new Date(promocion.fechaFin)) {
        throw { status: 400, message: "La promoción no está vigente" };
      }

      if (promocion.tipo === "descuento_porcentaje") {
        descuento = parseFloat((subtotalBruto * (promocion.valor / 100)).toFixed(2));
      } else if (promocion.tipo === "descuento_fijo") {
        descuento = parseFloat(Math.min(Number(promocion.valor), subtotalBruto).toFixed(2));
      } else if (promocion.tipo === "2x1") {
        // paga la mitad del total
        descuento = parseFloat((subtotalBruto / 2).toFixed(2));
      }
    }

    const total = parseFloat((subtotalBruto - descuento).toFixed(2));

    const venta = manager.create("Venta", {
      empleadoId,
      sesionId,
      total,
      descuento,
      promocionId: promocionId ?? null,
    });
    const ventaGuardada = await manager.save("Venta", venta);

    const detallesConVenta = detalles.map((d) => ({ ...d, ventaId: ventaGuardada.id }));
    await manager.save("DetalleVenta", detallesConVenta);

    return manager.findOne("Venta", {
      where: { id: ventaGuardada.id },
      relations: ["detalles", "detalles.producto"],
    });
  });
}

export async function remove(id) {
  const venta = await getById(id);
  return repo().remove(venta);
}

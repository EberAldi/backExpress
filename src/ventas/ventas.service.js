import { AppDataSource } from "../data-source.js";
import { sumarPuntos, restarPuntos } from "../cliente/cliente.service.js";
import { randomUUID, randomBytes } from "crypto";

async function generarCodigoUnico() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const ventaRepo = AppDataSource.getRepository("Venta");
  let codigo;
  let existe = true;
  while (existe) {
    codigo = Array.from(randomBytes(8))
      .map((b) => chars[b % chars.length])
      .join("");
    existe = await ventaRepo.existsBy({ canjeCodigo: codigo });
  }
  return codigo;
}

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

    if (sesionId) {
      const sesion = await manager.findOne("Sesion", { where: { id: sesionId } });
      if (sesion?.clienteId) {
        await sumarPuntos(sesion.clienteId, Math.floor(total / 20), "venta", `Compra de productos $${total}`);
      }
    }

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

export async function getByToken(token) {
  const venta = await repo().findOne({
    where: [{ canjeToken: token }, { canjeCodigo: token.toUpperCase() }],
    relations: ["detalles", "detalles.producto"],
  });
  if (!venta) throw { status: 404, message: "Token o código de canje no válido" };
  return venta;
}

export async function canjear(token) {
  const venta = await getByToken(token);
  if (venta.canjeado) {
    throw { status: 400, message: "Este canje ya fue utilizado" };
  }
  await repo().update(venta.id, { canjeado: true, canjeadoEn: new Date() });
  return getByToken(token);
}

/*
  body esperado:
  {
    clienteId: "uuid",
    empleadoId: 1,
    sesionId: 3,   // opcional
    items: [
      { productoId: 1, cantidad: 2 }
    ]
  }
*/
export async function pagarConPuntos({ clienteId, sesionId = null, items }) {
  if (!clienteId) throw { status: 400, message: "Se requiere clienteId" };
  if (!items || items.length === 0) throw { status: 400, message: "La venta debe tener al menos un producto" };

  return AppDataSource.transaction(async (manager) => {
    const cliente = await manager.findOne("Cliente", { where: { id: clienteId, isActive: true } });
    if (!cliente) throw { status: 404, message: "Cliente no encontrado" };

    let totalPuntos = 0;
    const detalles = [];

    for (const item of items) {
      const producto = await manager.findOne("Producto", { where: { id: item.productoId } });
      if (!producto) throw { status: 404, message: `Producto ${item.productoId} no encontrado` };
      if (!producto.disponibleConPuntos) {
        throw { status: 400, message: `El producto "${producto.nombre}" no está disponible para canje con puntos` };
      }
      if (!producto.costoEnPuntos) {
        throw { status: 400, message: `El producto "${producto.nombre}" no tiene precio en puntos configurado` };
      }
      if (producto.stock < item.cantidad) {
        throw { status: 400, message: `Stock insuficiente para "${producto.nombre}"` };
      }

      const puntosItem = producto.costoEnPuntos * item.cantidad;
      totalPuntos += puntosItem;

      detalles.push({
        productoId: item.productoId,
        cantidad: item.cantidad,
        precioUnitario: 0,
        subtotal: 0,
      });

      await manager.update("Producto", item.productoId, {
        stock: producto.stock - item.cantidad,
      });
    }

    if (cliente.puntosAcumulados < totalPuntos) {
      throw {
        status: 400,
        message: `Puntos insuficientes. Necesitas ${totalPuntos}, tienes ${cliente.puntosAcumulados}`,
      };
    }

    await restarPuntos(clienteId, totalPuntos, `Canje de ${items.length} producto(s)`);

    const canjeToken = randomUUID();
    const canjeCodigo = await generarCodigoUnico();

    const venta = manager.create("Venta", {
      empleadoId: null,
      sesionId,
      total: 0,
      descuento: 0,
      puntosUsados: totalPuntos,
      canjeToken,
      canjeCodigo,
    });
    const ventaGuardada = await manager.save("Venta", venta);

    const detallesConVenta = detalles.map((d) => ({ ...d, ventaId: ventaGuardada.id }));
    await manager.save("DetalleVenta", detallesConVenta);

    const ventaCompleta = await manager.findOne("Venta", {
      where: { id: ventaGuardada.id },
      relations: ["detalles", "detalles.producto"],
    });

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(canjeToken)}`;

    return { ...ventaCompleta, qr: qrUrl };
  });
}

import { AppDataSource } from "../data-source.js";
import bcrypt from "bcrypt";

const repo = () => AppDataSource.getRepository("Cliente");

export async function findByEmail(email) {
  return repo().findOne({ where: { email, isActive: true } });
}

export async function setPassword(id, plainPassword) {
  const hash = await bcrypt.hash(plainPassword, 10);
  await repo().update(id, { password: hash });
}

export async function getAll() {
  return repo().find({
    where: { isActive: true },
    order: { creadoEn: "DESC" },
  });
}

export async function getById(id) {
  const cliente = await repo().findOne({
    where: { id, isActive: true },
    relations: ["sesiones", "reservaciones"],
  });
  if (!cliente) throw { status: 404, message: `Cliente con ID ${id} no encontrado` };
  return cliente;
}

export async function create(data) {
  if (data.password) {
    data.password = await bcrypt.hash(data.password, 10);
  }
  const cliente = repo().create(data);
  return repo().save(cliente);
}

export async function update(id, data) {
  await getById(id);
  if (data.password) {
    data.password = await bcrypt.hash(data.password, 10);
  }
  await repo().update(id, data);
  return getById(id);
}

export async function remove(id) {
  await getById(id);
  await repo().update(id, { isActive: false, eliminadoEn: new Date() });
  return { mensaje: "Cliente eliminado correctamente", id };
}

export async function getReservaciones(id) {
  const cliente = await repo().findOne({ where: { id, isActive: true } });
  if (!cliente) throw { status: 404, message: `Cliente con ID ${id} no encontrado` };
  return AppDataSource.getRepository("Reservacion").find({
    where: { clienteId: id },
    relations: ["consola"],
    order: { creadoEn: "DESC" },
  });
}

const PUNTOS_POR_PESO = 1 / 10; // 1 punto por cada $10

export async function getHistorial(id, limit = 10) {
  const cliente = await repo().findOne({ where: { id, isActive: true } });
  if (!cliente) throw { status: 404, message: `Cliente con ID ${id} no encontrado` };

  const sesiones = await AppDataSource.getRepository("Sesion").find({
    where: { clienteId: id },
    relations: ["consola", "ventas", "ventas.detalles", "ventas.detalles.producto"],
    order: { inicio: "DESC" },
    take: limit,
  });

  const historial = sesiones.map((sesion) => {
    const puntosConsola = Math.floor((parseFloat(sesion.costoConsola) || 0) * PUNTOS_POR_PESO);

    const compras = (sesion.ventas || []).map((venta) => ({
      ventaId: venta.id,
      fecha: venta.creadoEn,
      total: parseFloat(venta.total),
      descuento: parseFloat(venta.descuento),
      puntosGanados: Math.floor(parseFloat(venta.total) * PUNTOS_POR_PESO),
      productos: (venta.detalles || []).map((d) => ({
        nombre: d.producto?.nombre ?? "Producto eliminado",
        cantidad: d.cantidad,
        precioUnitario: parseFloat(d.precioUnitario),
        subtotal: parseFloat(d.subtotal),
      })),
    }));

    const puntosCompras = compras.reduce((acc, c) => acc + c.puntosGanados, 0);

    return {
      sesionId: sesion.id,
      consola: sesion.consola?.nombre ?? null,
      inicio: sesion.inicio,
      fin: sesion.fin,
      estado: sesion.estado,
      costoConsola: parseFloat(sesion.costoConsola) || null,
      puntosConsola,
      compras,
      puntosCompras,
      puntosTotalesSesion: puntosConsola + puntosCompras,
    };
  });

  return {
    puntosActuales: cliente.puntosAcumulados,
    totalSesiones: historial.length,
    sesiones: historial,
  };
}

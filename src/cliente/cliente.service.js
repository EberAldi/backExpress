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

export async function getByPuntos() {
  return repo().find({
    where: { isActive: true },
    order: { puntosAcumulados: "DESC" },
  });
}

export async function getById(id) {
  const cliente = await repo().findOne({
    where: { id, isActive: true },
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

  return AppDataSource.getRepository("Reservacion")
    .createQueryBuilder("reservacion")
    .leftJoinAndSelect("reservacion.consola", "consola")
    .leftJoinAndSelect("reservacion.sesion", "sesion")
    .where("reservacion.clienteId = :id", { id })
    .orderBy("reservacion.creadoEn", "DESC")
    .getMany();
}

export async function getHistorialPuntos(id, limit = 20) {
  const cliente = await repo().findOne({ where: { id, isActive: true } });
  if (!cliente) throw { status: 404, message: `Cliente con ID ${id} no encontrado` };

  const movimientos = await AppDataSource.getRepository("HistorialPuntos").find({
    where: { clienteId: id },
    order: { creadoEn: "DESC" },
    take: limit,
  });

  return {
    clienteId: cliente.id,
    nombre: cliente.nombre,
    puntosActuales: cliente.puntosAcumulados,
    movimientos,
  };
}

const PUNTOS_POR_PESO = 1 / 20;
const PUNTOS_POR_HORA = 10;

async function registrarMovimiento(clienteId, puntos, tipo, descripcion) {
  const cliente = await repo().findOne({ where: { id: clienteId } });
  if (!cliente) return;
  const saldoAnterior = cliente.puntosAcumulados;
  const saldoNuevo = saldoAnterior + puntos;
  await repo().update(clienteId, { puntosAcumulados: saldoNuevo });
  await AppDataSource.getRepository("HistorialPuntos").save({
    clienteId,
    puntos,
    tipo,
    descripcion,
    saldoAnterior,
    saldoNuevo,
  });
}

export async function sumarPuntos(clienteId, puntos, tipo = "pago", descripcion = "") {
  if (!clienteId || puntos <= 0) return;
  await registrarMovimiento(clienteId, puntos, tipo, descripcion);
}

export async function restarPuntos(clienteId, puntos, descripcion = "") {
  if (!clienteId || puntos <= 0) return;
  await registrarMovimiento(clienteId, -puntos, "canje", descripcion);
}

export async function getHistorial(id, limit = 10) {
  const cliente = await repo().findOne({ where: { id, isActive: true } });
  if (!cliente) throw { status: 404, message: `Cliente con ID ${id} no encontrado` };

  // QueryBuilder evita conflictos con eager loading de detalles en Venta
  const sesiones = await AppDataSource.getRepository("Sesion")
    .createQueryBuilder("sesion")
    .leftJoinAndSelect("sesion.consola", "consola")
    .leftJoinAndSelect("sesion.ventas", "venta")
    .leftJoinAndSelect("venta.detalles", "detalle")
    .leftJoinAndSelect("detalle.producto", "producto")
    .where("sesion.clienteId = :id", { id })
    .orderBy("sesion.inicio", "DESC")
    .take(limit)
    .getMany();

  const historial = sesiones.map((sesion) => {
    const puntosConsola = (sesion.duracionHoras || 0) * PUNTOS_POR_HORA;

    const compras = (sesion.ventas || []).map((venta) => {
      const totalVenta = parseFloat(venta.total) || 0;
      const descuento = parseFloat(venta.descuento) || 0;
      return {
        ventaId: venta.id,
        fecha: venta.creadoEn,
        total: totalVenta,
        descuento,
        puntosGanados: Math.floor(totalVenta * PUNTOS_POR_PESO),
        productos: (venta.detalles || []).map((d) => ({
          nombre: d.producto?.nombre ?? "Producto eliminado",
          cantidad: d.cantidad,
          precioUnitario: parseFloat(d.precioUnitario),
          subtotal: parseFloat(d.subtotal),
        })),
      };
    });

    const puntosCompras = compras.reduce((acc, c) => acc + c.puntosGanados, 0);

    return {
      sesionId: sesion.id,
      consola: sesion.consola?.nombre ?? null,
      inicio: sesion.inicio,
      fin: sesion.fin,
      estado: sesion.estado,
      pagoEstado: sesion.pagoEstado,
      duracionHoras: sesion.duracionHoras,
      costoConsola: parseFloat(sesion.costoConsola) || null,
      puntosConsola,
      compras,
      puntosCompras,
      puntosTotalesSesion: puntosConsola + puntosCompras,
    };
  });

  return {
    clienteId: cliente.id,
    nombre: cliente.nombre,
    puntosActuales: cliente.puntosAcumulados,
    totalSesiones: historial.length,
    sesiones: historial,
  };
}

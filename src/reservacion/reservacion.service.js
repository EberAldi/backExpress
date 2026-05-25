import { AppDataSource } from "../data-source.js";
import {
  enviarConfirmacionReservacion,
  enviarCancelacionReservacion,
} from "../services/email.service.js";
import {
  notificarNuevaReservacion,
  notificarCancelacion,
} from "../services/web.push.service.js";

const repo = () => AppDataSource.getRepository("Reservacion");
const consolaRepo = () => AppDataSource.getRepository("Consola");

export async function getAll() {
  return repo().find({
    relations: ["cliente", "consola"],
    order: { creadoEn: "DESC" },
  });
}

export async function getById(id) {
  const reservacion = await repo().findOne({
    where: { id },
    relations: ["cliente", "consola", "sesion"],
  });
  if (!reservacion)
    throw { status: 404, message: `Reservación con ID ${id} no encontrada` };
  return reservacion;
}

export async function create(data) {
  const { consolaId, fechaInicio, horaInicio, ...rest } = data;

  const consola = await consolaRepo().findOne({ where: { id: consolaId } });
  if (!consola) throw { status: 404, message: "Consola no encontrada" };

  const fechaHora = new Date(`${fechaInicio}T${horaInicio}:00`);

  const reservacion = repo().create({
    estado: "pendiente",
    ...rest,
    consolaId,
    fechaInicio: fechaHora,
  });

  const saved = await repo().save(reservacion);

  // Cargar relaciones para el email
  const completa = await getById(saved.id);

  // Email + push (errores no bloquean la respuesta)
  if (completa.cliente?.email) {
    enviarConfirmacionReservacion(completa.cliente, completa);
  }
  notificarNuevaReservacion(completa).catch(console.error);

  return completa;
}

export async function confirmar(id, { empleadoId = null } = {}) {
  const reservacion = await getById(id);
  if (reservacion.estado !== "pendiente") {
    throw {
      status: 400,
      message: `No se puede confirmar una reservación en estado "${reservacion.estado}"`,
    };
  }

  await repo().update(id, { estado: "confirmada" });

  const sesionRepo = AppDataSource.getRepository("Sesion");
  const sesion = sesionRepo.create({
    consolaId: reservacion.consolaId,
    clienteId: reservacion.clienteId,
    empleadoId: empleadoId ?? null,
    duracionHoras: reservacion.duracionHoras,
    reservacionId: id,
    inicio: reservacion.fechaInicio,
    precioHoraAplicado: reservacion.consola.precioPorHora,
    estado: "activa",
    pagoEstado: "pendiente",
  });
  await sesionRepo.save(sesion);

  return getById(id);
}

export async function cancelar(id, { motivo } = {}) {
  const reservacion = await getById(id);
  if (["completada", "cancelada"].includes(reservacion.estado)) {
    throw {
      status: 400,
      message: `No se puede cancelar una reservación en estado "${reservacion.estado}"`,
    };
  }
  await repo().update(id, {
    estado: "cancelada",
    canceladoEn: new Date(),
    motivoCancelacion: motivo ?? null,
  });

  const cancelada = await getById(id);

  // Email + push cancelación
  if (cancelada.cliente?.email) {
    enviarCancelacionReservacion(cancelada.cliente, cancelada, motivo);
  }
  notificarCancelacion(cancelada).catch(console.error);

  return cancelada;
}

export async function update(id, data) {
  await getById(id);
  await repo().update(id, data);
  return getById(id);
}

export async function remove(id) {
  const reservacion = await getById(id);
  return repo().remove(reservacion);
}

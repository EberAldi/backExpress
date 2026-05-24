import { AppDataSource } from "../data-source.js";

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
  if (!reservacion) throw { status: 404, message: `Reservación con ID ${id} no encontrada` };
  return reservacion;
}

export async function create(data) {
  const { consolaId, fechaInicio, horaInicio, ...rest } = data;

  const consola = await consolaRepo().findOne({ where: { id: consolaId } });
  if (!consola) throw { status: 404, message: "Consola no encontrada" };

  const fechaHora = new Date(`${fechaInicio}T${horaInicio}:00`);

  const reservacion = repo().create({ estado: "pendiente", ...rest, consolaId, fechaInicio: fechaHora });
  return repo().save(reservacion);
}

export async function confirmar(id) {
  const reservacion = await getById(id);
  if (reservacion.estado !== "pendiente") {
    throw { status: 400, message: `No se puede confirmar una reservación en estado "${reservacion.estado}"` };
  }
  await repo().update(id, { estado: "confirmada" });
  return getById(id);
}

export async function cancelar(id, { motivo } = {}) {
  const reservacion = await getById(id);
  if (["completada", "cancelada"].includes(reservacion.estado)) {
    throw { status: 400, message: `No se puede cancelar una reservación en estado "${reservacion.estado}"` };
  }
  await repo().update(id, {
    estado: "cancelada",
    canceladoEn: new Date(),
    motivoCancelacion: motivo ?? null,
  });
  return getById(id);
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

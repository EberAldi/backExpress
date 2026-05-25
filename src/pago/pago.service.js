import { AppDataSource } from "../data-source.js";

const repo = () => AppDataSource.getRepository("Pago");

export async function getAll(estado) {
  const where = {};
  if (estado) where.estado = estado;
  return repo().find({
    where,
    relations: ["sesion", "reservacion", "venta"],
    order: { creadoEn: "DESC" },
  });
}

export async function getById(id) {
  const pago = await repo().findOne({
    where: { id },
    relations: ["sesion", "reservacion", "venta"],
  });
  if (!pago) throw { status: 404, message: `Pago con ID ${id} no encontrado` };
  return pago;
}

export async function create(data) {
  const pago = repo().create(data);
  return repo().save(pago);
}

export async function update(id, data) {
  await getById(id);
  if (data.estado === "procesando" || data.estado === "completado") {
    data.procesadoEn = new Date();
  }
  await repo().update(id, data);
  return getById(id);
}

export async function remove(id) {
  const pago = await getById(id);
  return repo().remove(pago);
}

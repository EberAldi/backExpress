import { AppDataSource } from "../data-source.js";

const repo = () => AppDataSource.getRepository("Promocion");

export async function getAll(soloActivas = false) {
  const where = {};
  if (soloActivas) where.activo = true;
  return repo().find({ where, order: { fechaInicio: "DESC" } });
}

export async function getById(id) {
  const promocion = await repo().findOne({ where: { id } });
  if (!promocion) throw { status: 404, message: `Promoción con ID ${id} no encontrada` };
  return promocion;
}

export async function create(data) {
  const promocion = repo().create(data);
  return repo().save(promocion);
}

export async function update(id, data) {
  await getById(id);
  await repo().update(id, data);
  return getById(id);
}

export async function remove(id) {
  await getById(id);
  await repo().update(id, { activo: false });
  return { mensaje: "Promoción desactivada correctamente", id };
}

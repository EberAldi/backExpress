import { AppDataSource } from "../data-source.js";

const repo = () => AppDataSource.getRepository("Configuracion");

export async function getAll(tipo) {
  const where = { activo: true };
  if (tipo) where.tipo = tipo;
  return repo().find({ where, order: { creadoEn: "DESC" } });
}

export async function getById(id) {
  const config = await repo().findOne({ where: { id, activo: true } });
  if (!config) throw { status: 404, message: `Configuración con ID ${id} no encontrada` };
  return config;
}

export async function create(data) {
  const config = repo().create(data);
  return repo().save(config);
}

export async function update(id, data) {
  await getById(id);
  await repo().update(id, data);
  return getById(id);
}

export async function remove(id) {
  await getById(id);
  await repo().update(id, { activo: false });
  return { mensaje: "Configuración eliminada correctamente", id };
}

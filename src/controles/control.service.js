import { AppDataSource } from "../data-source.js";

const repo = () => AppDataSource.getRepository("Control");
const consolaRepo = () => AppDataSource.getRepository("Consola");

export async function getAll() {
  return repo().find({ relations: ["consola"] });
}

export async function getById(id) {
  const control = await repo().findOne({ where: { id }, relations: ["consola"] });
  if (!control) throw { status: 404, message: "Control no encontrado" };
  return control;
}

export async function getByConsola(consolaId) {
  return repo().find({ where: { consolaId } });
}

export async function create(data) {
  // Verificar que la consola exista si viene consolaId
  if (data.consolaId) {
    const consola = await consolaRepo().findOne({ where: { id: data.consolaId } });
    if (!consola) throw { status: 404, message: "Consola no encontrada" };
  }
  const control = repo().create(data);
  return repo().save(control);
}

export async function update(id, data) {
  const control = await getById(id);
  if (data.consolaId) {
    const consola = await consolaRepo().findOne({ where: { id: data.consolaId } });
    if (!consola) throw { status: 404, message: "Consola no encontrada" };
  }
  Object.assign(control, data);
  return repo().save(control);
}

export async function remove(id) {
  const control = await getById(id);
  return repo().remove(control);
}

export async function cambiarEstado(id, estado) {
  const estadosValidos = ["disponible", "dañado"];
  if (!estadosValidos.includes(estado)) {
    throw { status: 400, message: `Estado inválido. Usa: ${estadosValidos.join(", ")}` };
  }
  return update(id, { estado });
}
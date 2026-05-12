import { AppDataSource } from "../data-source.js";

const repo = () => AppDataSource.getRepository("Juego");
const consolaRepo = () => AppDataSource.getRepository("Consola");

export async function getAll() {
  return repo().find({ relations: ["consolas"] });
}

export async function getById(id) {
  const juego = await repo().findOne({ where: { id }, relations: ["consolas"] });
  if (!juego) throw { status: 404, message: "Juego no encontrado" };
  return juego;
}

export async function getByConsola(consolaId) {
  return repo()
    .createQueryBuilder("juego")
    .innerJoin("juego.consolas", "consola", "consola.id = :consolaId", { consolaId })
    .where("juego.disponible = true")
    .getMany();
}

export async function create(data) {
  const juego = repo().create(data);
  return repo().save(juego);
}

export async function update(id, data) {
  const juego = await getById(id);
  Object.assign(juego, data);
  return repo().save(juego);
}

export async function remove(id) {
  const juego = await getById(id);
  return repo().remove(juego);
}

// Asignar juego a una consola
export async function asignarConsola(juegoId, consolaId) {
  const juego = await repo().findOne({ where: { id: juegoId }, relations: ["consolas"] });
  if (!juego) throw { status: 404, message: "Juego no encontrado" };

  const consola = await consolaRepo().findOne({ where: { id: consolaId } });
  if (!consola) throw { status: 404, message: "Consola no encontrada" };

  const yaAsignado = juego.consolas.some((c) => c.id === consolaId);
  if (yaAsignado) throw { status: 409, message: "El juego ya está asignado a esa consola" };

  juego.consolas.push(consola);
  return repo().save(juego);
}

// Quitar juego de una consola
export async function quitarConsola(juegoId, consolaId) {
  const juego = await repo().findOne({ where: { id: juegoId }, relations: ["consolas"] });
  if (!juego) throw { status: 404, message: "Juego no encontrado" };

  juego.consolas = juego.consolas.filter((c) => c.id !== consolaId);
  return repo().save(juego);
}
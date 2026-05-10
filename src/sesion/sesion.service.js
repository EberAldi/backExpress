import { AppDataSource } from "../data-source.js";

const repo = () => AppDataSource.getRepository("Sesion");
const consolaRepo = () => AppDataSource.getRepository("Consola");

export async function getAll() {
  return repo().find({ relations: ["consola", "empleado"] });
}

export async function getById(id) {
  const sesion = await repo().findOne({
    where: { id },
    relations: ["consola", "empleado", "ventas"],
  });
  if (!sesion) throw { status: 404, message: "Sesión no encontrada" };
  return sesion;
}

export async function getActivas() {
  return repo().find({
    where: { estado: "activa" },
    relations: ["consola", "empleado"],
  });
}

export async function abrir({ consolaId, empleadoId }) {
  const consola = await consolaRepo().findOne({ where: { id: consolaId } });
  if (!consola) throw { status: 404, message: "Consola no encontrada" };
  if (consola.estado !== "disponible") {
    throw { status: 400, message: `La consola está ${consola.estado}` };
  }

  // Abrir sesión
  const sesion = repo().create({
    consolaId,
    empleadoId,
    inicio: new Date(),
    estado: "activa",
    pagoEstado: "pendiente",
  });
  const saved = await repo().save(sesion);

  // Marcar consola como ocupada
  await consolaRepo().update(consolaId, { estado: "ocupada" });

  return saved;
}

export async function cerrar(id) {
  const sesion = await repo().findOne({
    where: { id },
    relations: ["consola"],
  });
  if (!sesion) throw { status: 404, message: "Sesión no encontrada" };
  if (sesion.estado === "cerrada") throw { status: 400, message: "La sesión ya está cerrada" };

  const fin = new Date();
  const totalMinutos = Math.ceil((fin - new Date(sesion.inicio)) / 60000);
  const costoConsola = parseFloat(
    ((totalMinutos / 60) * sesion.consola.precioPorHora).toFixed(2)
  );

  Object.assign(sesion, { fin, totalMinutos, costoConsola, estado: "cerrada" });
  const saved = await repo().save(sesion);

  // Liberar consola
  await consolaRepo().update(sesion.consolaId, {
    estado: "disponible",
    usoHoy: () => "usoHoy + 1",  // incrementar uso del día
  });

  return saved;
}

export async function remove(id) {
  const sesion = await getById(id);
  if (sesion.estado === "activa") {
    throw { status: 400, message: "No puedes eliminar una sesión activa" };
  }
  return repo().remove(sesion);
}
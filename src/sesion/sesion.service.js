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

export async function abrir({
  consolaId,
  empleadoId,
  juegoId = null,
  duracionHoras = 1,
}) {

  const consola = await consolaRepo().findOne({
    where: { id: consolaId }
  });

  if (!consola) {
    throw {
      status: 404,
      message: "Consola no encontrada",
    };
  }

  if (consola.estado !== "disponible") {
    throw {
      status: 400,
      message: `La consola está ${consola.estado}`,
    };
  }

  // validar juego en consola
  if (juegoId) {

    const juegoRepo = AppDataSource.getRepository("Juego");

    const juego = await juegoRepo
      .createQueryBuilder("juego")
      .innerJoin(
        "juego.consolas",
        "consola",
        "consola.id = :consolaId",
        { consolaId }
      )
      .where("juego.id = :juegoId", { juegoId })
      .getOne();

    if (!juego) {
      throw {
        status: 400,
        message: "Ese juego no está disponible en esta consola",
      };
    }
  }

  const sesion = repo().create({
    consolaId,
    empleadoId,
    juegoId,
    duracionHoras,
    inicio: new Date(),
    estado: "activa",
    pagoEstado: "pendiente",
  });

  const saved = await repo().save(sesion);

  // ocupar consola
  await consolaRepo().update(consolaId, {
    estado: "ocupada",
  });

  return saved;
}

export async function autoCerrarSesiones() {

  const sesiones = await repo().find({
    where: {
      estado: "activa",
    },
    relations: ["consola"],
  });

  const ahora = new Date();

  for (const sesion of sesiones) {

    const inicio = new Date(sesion.inicio);

    const tiempoFinal = new Date(
      inicio.getTime() + (sesion.duracionHoras * 60 * 60 * 1000)
    );

    // si ya expiró
    if (ahora >= tiempoFinal) {

     const totalMinutos = sesion.duracionHoras * 60;

const costoConsola = parseFloat(
  (
    sesion.duracionHoras *
    sesion.consola.precioPorHora
  ).toFixed(2)
);

      await repo().update(sesion.id, {
        fin: ahora,
        totalMinutos,
        costoConsola,
        estado: "cerrada",
      });

      // liberar consola
      await consolaRepo().update(sesion.consolaId, {
        estado: "disponible",
        usoHoy: () => "usoHoy + 1",
      });

      console.log(
        `Sesión ${sesion.id} cerrada automáticamente`
      );
    }
  }
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

export async function agregarTiempo(id) {

  const sesion = await repo().findOne({
    where: { id },
  })

  if (!sesion) {

    throw {
      status: 404,
      message: "Sesión no encontrada",
    }
  }

  if (sesion.estado === "cerrada") {

    throw {
      status: 400,
      message: "La sesión ya está cerrada",
    }
  }

  sesion.duracionHoras += 1

  return repo().save(sesion)
}
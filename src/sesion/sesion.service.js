import { AppDataSource } from "../data-source.js";
import { Between } from "typeorm";
import {
  notificarSesionPorTerminar,
  notificarReservacionProxima,
} from "../services/web.push.service.js";
import { sumarPuntos } from "../cliente/cliente.service.js";

const repo = () => AppDataSource.getRepository("Sesion");
const consolaRepo = () => AppDataSource.getRepository("Consola");

export async function getAll() {
  return repo().find({ relations: ["consola", "empleado"] });
}

export async function getAllDetalle() {
  const sesiones = await repo().find({
    relations: ["consola", "empleado", "cliente", "reservacion"],
    order: { inicio: "DESC" },
  });
  return sesiones.map((s) => ({
    ...s,
    esReservada: s.reservacionId !== null,
  }));
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
  clienteId: _clienteId = null,
  juegoId = null,
  duracionHoras = 1,
  reservacionId = null,
  configuracionAplicadaId = null,
}) {
  let clienteId = _clienteId;

  const consola = await consolaRepo().findOne({ where: { id: consolaId } });
  if (!consola) throw { status: 404, message: "Consola no encontrada" };
  if (consola.estado !== "disponible") {
    throw { status: 400, message: `La consola está ${consola.estado}` };
  }

  // validar que el juego esté disponible en la consola
  if (juegoId) {
    const juego = await AppDataSource.getRepository("Juego")
      .createQueryBuilder("juego")
      .innerJoin("juego.consolas", "consola", "consola.id = :consolaId", { consolaId })
      .where("juego.id = :juegoId", { juegoId })
      .getOne();
    if (!juego) throw { status: 400, message: "Ese juego no está disponible en esta consola" };
  }

  // Si viene reservacionId: validar estado y heredar clienteId si no se mandó
  if (reservacionId) {
    const reservacion = await AppDataSource.getRepository("Reservacion").findOne({
      where: { id: reservacionId },
    });
    if (!reservacion) throw { status: 404, message: "Reservación no encontrada" };
    if (!["pendiente", "confirmada"].includes(reservacion.estado)) {
      throw { status: 400, message: `La reservación está en estado "${reservacion.estado}"` };
    }
    if (!clienteId) clienteId = reservacion.clienteId;
  }

  // precio histórico: base de la consola, sobreescrito si hay configuración activa
  let precioHoraAplicado = consola.precioPorHora;
  if (configuracionAplicadaId) {
    const config = await AppDataSource.getRepository("Configuracion").findOne({
      where: { id: configuracionAplicadaId, activo: true },
    });
    if (!config) throw { status: 404, message: "Configuración no encontrada o inactiva" };
    if (config.configuracion?.precio) {
      precioHoraAplicado = config.configuracion.precio;
    }
  }

  const sesion = repo().create({
    consolaId,
    empleadoId,
    clienteId,
    juegoId,
    duracionHoras,
    reservacionId,
    configuracionAplicadaId,
    precioHoraAplicado,
    inicio: new Date(),
    estado: "activa",
    pagoEstado: "pendiente",
  });

  const saved = await repo().save(sesion);

  await consolaRepo().update(consolaId, { estado: "ocupada" });

  if (reservacionId) {
    await AppDataSource.getRepository("Reservacion").update(reservacionId, { estado: "activa" });
  }

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
  // usa el precio histórico guardado al abrir, no el actual de la consola
  const costoConsola = parseFloat(
    ((totalMinutos / 60) * sesion.precioHoraAplicado).toFixed(2)
  );

  Object.assign(sesion, { fin, totalMinutos, costoConsola, estado: "cerrada" });
  const saved = await repo().save(sesion);

  await consolaRepo().update(sesion.consolaId, {
    estado: "disponible",
    usoHoy: () => "usoHoy + 1",
  });

  if (sesion.reservacionId) {
    await AppDataSource.getRepository("Reservacion").update(sesion.reservacionId, {
      estado: "completada",
    });
  }

  if (sesion.clienteId) {
    await sumarPuntos(sesion.clienteId, sesion.duracionHoras * 10, "sesion", `${sesion.duracionHoras} hora(s) de renta`);
  }

  return saved;
}

export async function autoCerrarSesiones() {
  const sesiones = await repo().find({
    where: { estado: "activa" },
    relations: ["consola"],
  });

  const ahora = new Date();

  for (const sesion of sesiones) {
    const inicio = new Date(sesion.inicio);
    const tiempoFinal = new Date(inicio.getTime() + sesion.duracionHoras * 60 * 60 * 1000);
    const minutosRestantes = (tiempoFinal - ahora) / 60000;

    // Aviso 5 min antes de que termine
    if (minutosRestantes <= 5 && minutosRestantes > 0 && !sesion.avisoFinalEnviado) {
      notificarSesionPorTerminar(sesion).catch(console.error);
      await repo().update(sesion.id, { avisoFinalEnviado: true });
    }

    if (ahora >= tiempoFinal) {
      const totalMinutos = sesion.duracionHoras * 60;
      const costoConsola = parseFloat(
        (sesion.duracionHoras * sesion.precioHoraAplicado).toFixed(2)
      );

      await repo().update(sesion.id, { fin: ahora, totalMinutos, costoConsola, estado: "cerrada" });

      await consolaRepo().update(sesion.consolaId, {
        estado: "disponible",
        usoHoy: () => "usoHoy + 1",
      });

      if (sesion.reservacionId) {
        await AppDataSource.getRepository("Reservacion").update(sesion.reservacionId, {
          estado: "completada",
        });
      }

      if (sesion.clienteId) {
        await sumarPuntos(sesion.clienteId, sesion.duracionHoras * 10, "sesion", `${sesion.duracionHoras} hora(s) de renta`);
      }

      console.log(`Sesión ${sesion.id} cerrada automáticamente`);
    }
  }
}

export async function checarReservacionesProximas() {
  const ahora = new Date();
  const en35min = new Date(ahora.getTime() + 35 * 60 * 1000);
  const en25min = new Date(ahora.getTime() + 25 * 60 * 1000);

  const proximas = await AppDataSource.getRepository("Reservacion").find({
    where: {
      estado: "confirmada",
      fechaInicio: Between(en25min, en35min),
      avisoEnviado: false,
    },
    relations: ["consola", "cliente"],
  });

  for (const reservacion of proximas) {
    notificarReservacionProxima(reservacion).catch(console.error);
    await AppDataSource.getRepository("Reservacion").update(reservacion.id, { avisoEnviado: true });
  }
}

export async function remove(id) {
  const sesion = await getById(id);
  if (sesion.estado === "activa") {
    throw { status: 400, message: "No puedes eliminar una sesión activa" };
  }
  return repo().remove(sesion);
}

export async function agregarTiempo(id) {
  const sesion = await repo().findOne({ where: { id } });
  if (!sesion) throw { status: 404, message: "Sesión no encontrada" };
  if (sesion.estado === "cerrada") throw { status: 400, message: "La sesión ya está cerrada" };

  sesion.duracionHoras += 1;
  return repo().save(sesion);
}

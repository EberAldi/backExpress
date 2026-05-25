import webpush from "web-push";
import { In } from "typeorm";
import { AppDataSource } from "../data-source.js";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

const userRepo = () => AppDataSource.getRepository("User");

// ── Helpers ───────────────────────────────────────────────────

async function getEmpleados(roles = ["admin", "gerente", "empleado"]) {
  return userRepo().find({
    where: { rol: In(roles), activo: true },
    select: ["id", "pushSubscription"],
  });
}

async function enviar(usuarios, payload) {
  const repo = userRepo();
  await Promise.allSettled(
    usuarios
      .filter((u) => u.pushSubscription)
      .map(async (user) => {
        try {
          await webpush.sendNotification(
            JSON.parse(user.pushSubscription),
            JSON.stringify(payload)
          );
        } catch (err) {
          if (err.statusCode === 410 || err.statusCode === 404) {
            await repo.update(user.id, { pushSubscription: null });
          }
        }
      })
  );
}

// ── Notificaciones ────────────────────────────────────────────

export async function notificarNuevaReservacion(reservacion) {
  const usuarios = await getEmpleados();
  await enviar(usuarios, {
    title: "🎮 Nueva reservación",
    body: `${reservacion.cliente?.nombre ?? "Cliente"} — ${reservacion.consola?.nombre ?? ""}`,
    data: { url: `/dashboard/reservaciones/${reservacion.id}` },
  });
}

export async function notificarCancelacion(reservacion) {
  const usuarios = await getEmpleados(["admin", "gerente"]);
  await enviar(usuarios, {
    title: "❌ Reservación cancelada",
    body: `${reservacion.cliente?.nombre ?? "Cliente"} canceló ${reservacion.consola?.nombre ?? ""}`,
    data: { url: `/dashboard/reservaciones` },
  });
}

export async function notificarReservacionProxima(reservacion) {
  const usuarios = await getEmpleados();
  await enviar(usuarios, {
    title: "⏰ Reservación en 30 min",
    body: `${reservacion.cliente?.nombre ?? "Cliente"} — ${reservacion.consola?.nombre ?? ""}`,
    data: { url: `/dashboard/reservaciones/${reservacion.id}` },
  });
}

export async function notificarSesionPorTerminar(sesion) {
  const usuarios = await getEmpleados();
  await enviar(usuarios, {
    title: "⚡ Sesión por terminar",
    body: `${sesion.consola?.nombre ?? "Consola"} — quedan ~5 minutos`,
    tag: `sesion-fin-${sesion.id}`,
    data: { url: `/dashboard/sesiones/${sesion.id}` },
  });
}

export async function notificarPagoAprobado(sesionId, monto) {
  const usuarios = await getEmpleados(["admin", "gerente"]);
  await enviar(usuarios, {
    title: "💳 Pago aprobado",
    body: `Sesión #${sesionId} — $${monto} MXN vía MercadoPago`,
    data: { url: `/dashboard/pagos` },
  });
}

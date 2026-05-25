import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";

export async function enviarConfirmacionReservacion(cliente, reservacion) {
  if (!cliente?.email) return;

  const inicio = new Date(reservacion.fechaInicio);
  const fin = new Date(
    inicio.getTime() + (reservacion.duracionHoras ?? 1) * 60 * 60 * 1000
  );

  const fmt = (d) =>
    d.toLocaleDateString("es-MX", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const estado = reservacion.estado ?? "pendiente";

  await resend.emails.send({
    from: `Cyber Gaming <${FROM}>`,
    to: cliente.email,
    subject: "Reserva confirmada",
    html: templateConfirmacion({
      nombreCliente: cliente.nombre,
      idReservacion: reservacion.id,
      nombreConsola: reservacion.consola?.nombre ?? "N/A",
      fechaInicio: fmt(inicio),
      fechaLimite: fmt(fin),
      estado: estado.charAt(0).toUpperCase() + estado.slice(1),
    }),
  }).catch((err) => console.error("[email] Error enviando confirmación:", err));
}

export async function enviarCancelacionReservacion(cliente, reservacion, motivo) {
  if (!cliente?.email) return;

  await resend.emails.send({
    from: `Cyber Gaming <${FROM}>`,
    to: cliente.email,
    subject: "Reservación cancelada",
    html: templateCancelacion({
      nombreCliente: cliente.nombre,
      nombreConsola: reservacion.consola?.nombre ?? "N/A",
      fechaOriginal: new Date(reservacion.fechaInicio).toLocaleDateString("es-MX"),
      motivo: motivo ?? "No especificado",
    }),
  }).catch((err) => console.error("[email] Error enviando cancelación:", err));
}

// ── Templates ─────────────────────────────────────────────────

function templateConfirmacion({ nombreCliente, idReservacion, nombreConsola, fechaInicio, fechaLimite, estado }) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Arial,sans-serif;background:#f3f4f6;color:#333;padding:20px}
    .wrap{max-width:600px;margin:0 auto}
    .header{background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;padding:32px;text-align:center;border-radius:12px 12px 0 0}
    .header h1{font-size:22px;margin-top:8px}
    .body{background:#fff;padding:28px;border-radius:0 0 12px 12px;box-shadow:0 2px 8px rgba(0,0,0,.08)}
    .card{background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin:20px 0}
    .row{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #e5e7eb;font-size:14px}
    .row:last-child{border-bottom:none}
    .label{color:#6b7280;font-weight:600}
    .badge{background:#d1fae5;color:#065f46;padding:3px 10px;border-radius:20px;font-weight:700;font-size:13px}
    .footer{text-align:center;font-size:12px;color:#9ca3af;margin-top:24px}
  </style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <div style="font-size:36px">🎮</div>
    <h1>Reserva Confirmada</h1>
  </div>
  <div class="body">
    <p>Hola <strong>${nombreCliente}</strong>,</p>
    <p style="margin-top:8px">Tu reserva se creó correctamente. Aquí están los detalles:</p>

    <div class="card">
      <div class="row">
        <span class="label">Folio / Reserva:</span>
        <span><strong>#${idReservacion}</strong></span>
      </div>
      <div class="row">
        <span class="label">Videojuego / Consola:</span>
        <span>${nombreConsola}</span>
      </div>
      <div class="row">
        <span class="label">Fecha de reserva:</span>
        <span>${fechaInicio}</span>
      </div>
      <div class="row">
        <span class="label">Fecha límite:</span>
        <span>${fechaLimite}</span>
      </div>
      <div class="row">
        <span class="label">Estado:</span>
        <span class="badge">${estado}</span>
      </div>
    </div>

    <p style="margin-top:16px">Gracias por usar nuestro sistema. ¡Te esperamos!</p>
  </div>
  <div class="footer">
    <p>Cyber Gaming &mdash; Tu lugar favorito para jugar</p>
  </div>
</div>
</body>
</html>`;
}

function templateCancelacion({ nombreCliente, nombreConsola, fechaOriginal, motivo }) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <style>
    body{font-family:Arial,sans-serif;background:#f3f4f6;color:#333;padding:20px}
    .wrap{max-width:600px;margin:0 auto}
    .header{background:#ef4444;color:#fff;padding:32px;text-align:center;border-radius:12px 12px 0 0}
    .body{background:#fff;padding:28px;border-radius:0 0 12px 12px;box-shadow:0 2px 8px rgba(0,0,0,.08)}
    .card{background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin:20px 0;font-size:14px}
    .footer{text-align:center;font-size:12px;color:#9ca3af;margin-top:24px}
  </style>
</head>
<body>
<div class="wrap">
  <div class="header"><h1>❌ Reservación Cancelada</h1></div>
  <div class="body">
    <p>Hola <strong>${nombreCliente}</strong>,</p>
    <p style="margin-top:8px">Tu reservación ha sido cancelada.</p>
    <div class="card">
      <p><strong>Consola:</strong> ${nombreConsola}</p>
      <p style="margin-top:8px"><strong>Fecha original:</strong> ${fechaOriginal}</p>
      <p style="margin-top:8px"><strong>Motivo:</strong> ${motivo}</p>
    </div>
    <p>Esperamos verte pronto. Puedes hacer una nueva reservación cuando gustes.</p>
  </div>
  <div class="footer"><p>Cyber Gaming &mdash; Tu lugar favorito para jugar</p></div>
</div>
</body>
</html>`;
}

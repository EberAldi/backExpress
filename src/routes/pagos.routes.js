import { Router } from "express";
import crypto from "crypto";
import { AppDataSource } from "../data-source.js";
import {
  crearPreferenciaSesion,
  crearPreferenciaGenerica,
  obtenerEstadoPago,
} from "../services/mercadopago.service.js";
import { notificarPagoAprobado } from "../services/web.push.service.js";
import { sumarPuntos } from "../cliente/cliente.service.js";

const router = Router();

// ── Helpers ───────────────────────────────────────────────────

const pagoRepo = () => AppDataSource.getRepository("Pago");
const sesionRepo = () => AppDataSource.getRepository("Sesion");

// ── POST /api/pagos/sesiones/:id/pago ─────────────────────────
// Genera la preferencia MP + QR y registra el Pago como pendiente
router.post("/sesiones/:id/pago", async (req, res) => {
  try {
    const sesion = await sesionRepo().findOne({
      where: { id: Number(req.params.id) },
      relations: ["consola"],
    });
    if (!sesion) return res.status(404).json({ message: "Sesión no encontrada" });

    const total = Number(
      (sesion.duracionHoras * sesion.precioHoraAplicado).toFixed(2)
    );

    const mp = await crearPreferenciaSesion({ sesion, consola: sesion.consola, total });

    // Registrar el pago como pendiente en BD
    const pago = pagoRepo().create({
      monto: total,
      metodoPago: "mercadopago",
      estado: "pendiente",
      mpPreferenceId: mp.preferenceId,
      sesionId: sesion.id,
    });
    await pagoRepo().save(pago);

    return res.json({
      ok: true,
      pagoId: pago.id,
      total,
      preferenceId: mp.preferenceId,
      initPoint: mp.initPoint,
      sandboxInitPoint: mp.sandboxInitPoint,
      qr: mp.qr,
    });
  } catch (error) {
    console.error("[MP sesión]", error);
    return res.status(500).json({ message: error.message });
  }
});

// ── PATCH /api/pagos/sesiones/:id/efectivo ────────────────────
// Registra pago en efectivo: actualiza sesión y crea registro Pago
router.patch("/sesiones/:id/efectivo", async (req, res) => {
  try {
    const { ventaId = null, monto = null } = req.body ?? {};

    const sesion = await sesionRepo().findOne({
      where: { id: Number(req.params.id) },
    });
    if (!sesion) return res.status(404).json({ message: "Sesión no encontrada" });

    const montoFinal =
      monto ??
      Number((sesion.duracionHoras * sesion.precioHoraAplicado).toFixed(2));

    sesion.pagoEstado = "efectivo";
    await sesionRepo().save(sesion);

    const pagoData = {
      monto: montoFinal,
      metodoPago: "efectivo",
      estado: "completado",
      procesadoEn: new Date(),
      sesionId: sesion.id,
    };
    if (ventaId) pagoData.ventaId = ventaId;

    const pago = pagoRepo().create(pagoData);
    await pagoRepo().save(pago);

    if (sesion.clienteId) {
      await sumarPuntos(sesion.clienteId, Math.floor(montoFinal / 20), "pago", `Pago en efectivo $${montoFinal}`);
    }

    return res.json({ ok: true, pago, sesion });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// ── POST /api/pagos/webhook ───────────────────────────────────
// MercadoPago notifica aquí cuando un pago cambia de estado
router.post("/webhook", async (req, res) => {
  try {
    const type = req.body?.type ?? req.query?.type;
    const data = req.body?.data ?? { id: req.query?.["data.id"] };
    if (type !== "payment") return res.sendStatus(200);

    // Verificar firma HMAC solo en producción
    const isSandbox = process.env.MP_SANDBOX === "true";
    const xSignature = req.headers["x-signature"];
    const xRequestId = req.headers["x-request-id"];
    if (!isSandbox && xSignature && process.env.MP_WEBHOOK_SECRET) {
      const [tsPart, v1Part] = xSignature.split(",");
      const ts = tsPart.split("=")[1];
      const v1 = v1Part.split("=")[1];
      const manifest = `id:${data.id};request-id:${xRequestId};ts:${ts};`;
      const hash = crypto
        .createHmac("sha256", process.env.MP_WEBHOOK_SECRET)
        .update(manifest)
        .digest("hex");
      if (hash !== v1) return res.sendStatus(401);
    }

    // Obtener detalle completo del pago desde MP
    const response = await fetch(
      `https://api.mercadopago.com/v1/payments/${data.id}`,
      { headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` } }
    );
    const payment = await response.json();

    const nuevoEstado =
      payment.status === "approved"
        ? "completado"
        : payment.status === "pending" || payment.status === "in_process"
        ? "procesando"
        : "fallido";

    const sesionId = payment.external_reference
      ? Number(payment.external_reference)
      : null;

    // Buscar el registro Pago pendiente que se creó al generar la preferencia
    let pago = null;
    if (sesionId) {
      pago = await pagoRepo().findOne({
        where: { sesionId, metodoPago: "mercadopago", estado: "pendiente" },
      });
    }

    if (pago) {
      pago.mpPaymentId = String(data.id);
      pago.mpStatus = payment.status;
      pago.estado = nuevoEstado;
      if (nuevoEstado === "completado") pago.procesadoEn = new Date();
      await pagoRepo().save(pago);
    } else {
      // Fallback: MP puede notificar sin que hayamos creado la preferencia localmente
      const pagoFallback = pagoRepo().create({
        monto: payment.transaction_amount ?? 0,
        metodoPago: "mercadopago",
        estado: nuevoEstado,
        mpPaymentId: String(data.id),
        mpStatus: payment.status,
        ...(sesionId ? { sesionId } : {}),
        ...(nuevoEstado === "completado" ? { procesadoEn: new Date() } : {}),
      });
      await pagoRepo().save(pagoFallback);
    }

    // Marcar la sesión como pagada
    if (payment.status === "approved" && sesionId) {
      const sesion = await sesionRepo().findOne({ where: { id: sesionId } });
      if (sesion) {
        sesion.pagoEstado = "pagado";
        await sesionRepo().save(sesion);
        console.log(`[webhook] Sesión ${sesionId} marcada como pagada`);
        notificarPagoAprobado(sesionId, payment.transaction_amount ?? 0).catch(console.error);
        if (sesion.clienteId) {
          const monto = payment.transaction_amount ?? 0;
          await sumarPuntos(sesion.clienteId, Math.floor(monto / 20), "pago", `Pago MercadoPago $${monto}`);
        }
      }
    }

    return res.sendStatus(200);
  } catch (error) {
    console.error("[webhook MP]", error);
    return res.sendStatus(500);
  }
});

// ── POST /api/pagos/qr ────────────────────────────────────────
// Genera QR genérico (para ventas POS sin sesión asociada)
router.post("/qr", async (req, res) => {
  try {
    const { total, titulo, ventaId = null, sesionId = null } = req.body ?? {};

    const mp = await crearPreferenciaGenerica({ total, titulo, ventaId });

    const pagoData = {
      monto: Number(total),
      metodoPago: "mercadopago",
      estado: "pendiente",
      mpPreferenceId: mp.preferenceId,
    };
    if (ventaId) pagoData.ventaId = ventaId;
    if (sesionId) pagoData.sesionId = Number(sesionId);

    const pago = pagoRepo().create(pagoData);
    await pagoRepo().save(pago);

    return res.json({
      ok: true,
      pagoId: pago.id,
      qr: mp.qr,
      initPoint: mp.initPoint,
      preferenceId: mp.preferenceId,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// ── POST /api/pagos/efectivo ──────────────────────────────────
// Aprobación instantánea en efectivo (genérico, sin sesión)
router.post("/efectivo", async (req, res) => {
  try {
    const { total, ventaId = null, sesionId = null } = req.body ?? {};

    const pagoData = {
      monto: Number(total ?? 0),
      metodoPago: "efectivo",
      estado: "completado",
      procesadoEn: new Date(),
    };
    if (ventaId) pagoData.ventaId = ventaId;
    if (sesionId) pagoData.sesionId = Number(sesionId);

    const pago = pagoRepo().create(pagoData);
    await pagoRepo().save(pago);

    if (sesionId) {
      const sesion = await sesionRepo().findOne({ where: { id: Number(sesionId) } });
      if (sesion?.clienteId) {
        await sumarPuntos(sesion.clienteId, Math.floor(Number(total ?? 0) / 20), "pago", `Pago en efectivo $${total}`);
      }
    }

    return res.json({ ok: true, status: "approved", pago });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// ── GET /api/pagos/:id ────────────────────────────────────────
// Consulta el estado de un pago por su ID interno (UUID)
router.get("/:id", async (req, res) => {
  try {
    const pago = await pagoRepo().findOne({ where: { id: req.params.id } });
    if (!pago) return res.status(404).json({ message: "Pago no encontrado" });
    return res.json({
      id: pago.id,
      estado: pago.estado,
      monto: pago.monto,
      metodoPago: pago.metodoPago,
      mpPaymentId: pago.mpPaymentId ?? null,
      mpStatus: pago.mpStatus ?? null,
      procesadoEn: pago.procesadoEn ?? null,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

export default router;

// src/routes/pagos.routes.js
import { Router } from "express";
import { AppDataSource } from "../data-source.js";
import { crearPreferenciaSesion } from "../services/mercadopago.service.js";
import crypto from "crypto";

const router = Router();

// ── Generar link de pago para una sesión cerrada ─────────────
router.post("/sesiones/:id/pago", async (req, res) => {
  try {
    const sesionRepo = AppDataSource.getRepository("Sesion");
    const consolaRepo = AppDataSource.getRepository("Consola");

    const sesion = await sesionRepo.findOne({
      where: { id: Number(req.params.id) },
    });

    if (!sesion) return res.status(404).json({ message: "Sesión no encontrada" });
    if (sesion.estado !== "cerrada") return res.status(400).json({ message: "La sesión aún está activa" });
    if (sesion.pagoEstado === "pagado") return res.status(400).json({ message: "Ya fue pagada" });

    const consola = await consolaRepo.findOne({ where: { id: sesion.consolaId } });

    const { preferenceId, initPoint, sandboxInitPoint } = await crearPreferenciaSesion(sesion, consola);

    // Guardar el preferenceId para validar el webhook después
    sesion.mpPreferenceId = preferenceId;
    await sesionRepo.save(sesion);

    res.json({
      preferenceId,
      initPoint,
      sandboxInitPoint,   // usa este en desarrollo
      total: sesion.costoConsola,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── Webhook: Mercado Pago avisa que se pagó ──────────────────
router.post("/webhook", async (req, res) => {
  try {
    // MP manda el id del payment en el query
    const { type, data } = req.body;

    if (type !== "payment") return res.sendStatus(200);

    // Verificar firma (opcional pero recomendado)
    const xSignature = req.headers["x-signature"];
    const xRequestId = req.headers["x-request-id"];

    if (xSignature && process.env.MP_WEBHOOK_SECRET) {
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

    // Consultar el pago a la API de MP
    const response = await fetch(
      `https://api.mercadopago.com/v1/payments/${data.id}`,
      { headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` } }
    );
    const payment = await response.json();

    if (payment.status !== "approved") return res.sendStatus(200);

    // Buscar la sesión por external_reference
    const sesionRepo = AppDataSource.getRepository("Sesion");
    const sesion = await sesionRepo.findOne({
      where: { id: Number(payment.external_reference) },
    });

    if (!sesion) return res.sendStatus(404);

    sesion.pagoEstado = "pagado";
    await sesionRepo.save(sesion);

    res.sendStatus(200);
  } catch (error) {
    console.error("Webhook error:", error);
    res.sendStatus(500);
  }
});

// ── Marcar como pago en efectivo ─────────────────────────────
router.patch("/sesiones/:id/efectivo", async (req, res) => {
  try {
    const sesionRepo = AppDataSource.getRepository("Sesion");
    const sesion = await sesionRepo.findOne({ where: { id: Number(req.params.id) } });

    if (!sesion) return res.status(404).json({ message: "Sesión no encontrada" });

    sesion.pagoEstado = "efectivo";
    await sesionRepo.save(sesion);

    res.json({ message: "Marcada como pago en efectivo", sesion });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
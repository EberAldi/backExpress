import { Router } from "express";
import * as ventaService from "./ventas.service.js";
import { pagarConPuntos, canjear, getByToken } from "./ventas.service.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    res.json(await ventaService.getAll());
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    res.json(await ventaService.getById(Number(req.params.id)));
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
});

router.get("/sesion/:sesionId", async (req, res) => {
  try {
    res.json(await ventaService.getBySesion(Number(req.params.sesionId)));
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
});

router.post("/", async (req, res) => {
  try {
    res.status(201).json(await ventaService.create(req.body));
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
});

router.post("/puntos", async (req, res) => {
  try {
    res.status(201).json(await pagarConPuntos(req.body));
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
});

// Consultar info de un canje por token (para mostrar los productos antes de canjear)
router.get("/canje/:token", async (req, res) => {
  try {
    res.json(await getByToken(req.params.token));
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
});

// Marcar como canjeado — lo llama el empleado al escanear el QR
router.post("/canje/:token", async (req, res) => {
  try {
    res.json(await canjear(req.params.token));
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await ventaService.remove(Number(req.params.id));
    res.json({ message: "Venta eliminada" });
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
});

export default router;
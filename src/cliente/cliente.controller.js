import { Router } from "express";
import * as clienteService from "./cliente.service.js";
import { getHistorial, getReservaciones, getHistorialPuntos } from "./cliente.service.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    res.json(await clienteService.getAll());
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
});

router.get("/ranking", async (req, res) => {
  try {
    res.json(await clienteService.getByPuntos());
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
});

router.get("/:id/puntos", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    res.json(await getHistorialPuntos(req.params.id, limit));
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
});

router.get("/:id/historial", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    res.json(await getHistorial(req.params.id, limit));
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
});

router.get("/:id/reservaciones", async (req, res) => {
  try {
    res.json(await getReservaciones(req.params.id));
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    res.json(await clienteService.getById(req.params.id));
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
});

router.post("/", async (req, res) => {
  try {
    res.status(201).json(await clienteService.create(req.body));
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    res.json(await clienteService.update(req.params.id, req.body));
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    res.json(await clienteService.remove(req.params.id));
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
});

export default router;

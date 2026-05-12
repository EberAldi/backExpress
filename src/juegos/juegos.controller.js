import { Router } from "express";
import * as juegoService from "./juegos.service.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    res.json(await juegoService.getAll());
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
});

// Juegos disponibles en una consola específica — útil para mostrarle al cliente
router.get("/consola/:consolaId", async (req, res) => {
  try {
    res.json(await juegoService.getByConsola(Number(req.params.consolaId)));
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    res.json(await juegoService.getById(Number(req.params.id)));
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
});

router.post("/", async (req, res) => {
  try {
    res.status(201).json(await juegoService.create(req.body));
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    res.json(await juegoService.update(Number(req.params.id), req.body));
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await juegoService.remove(Number(req.params.id));
    res.json({ message: "Juego eliminado" });
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
});

// Asignar juego a consola — body: { consolaId }
router.post("/:id/consolas", async (req, res) => {
  try {
    res.json(await juegoService.asignarConsola(Number(req.params.id), req.body.consolaId));
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
});

// Quitar juego de consola
router.delete("/:id/consolas/:consolaId", async (req, res) => {
  try {
    res.json(await juegoService.quitarConsola(Number(req.params.id), Number(req.params.consolaId)));
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
});

export default router;
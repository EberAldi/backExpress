import { Router } from "express";
import * as controlService from "./control.service.js"

const router = Router();

router.get("/", async (req, res) => {
  try {
    res.json(await controlService.getAll());
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    res.json(await controlService.getById(Number(req.params.id)));
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
});

// Todos los controles de una consola específica
router.get("/consola/:consolaId", async (req, res) => {
  try {
    res.json(await controlService.getByConsola(Number(req.params.consolaId)));
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
});

router.post("/", async (req, res) => {
  try {
    res.status(201).json(await controlService.create(req.body));
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    res.json(await controlService.update(Number(req.params.id), req.body));
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await controlService.remove(Number(req.params.id));
    res.json({ message: "Control eliminado" });
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
});

router.patch("/:id/estado", async (req, res) => {
  try {
    res.json(await controlService.cambiarEstado(Number(req.params.id), req.body.estado));
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
});

export default router;
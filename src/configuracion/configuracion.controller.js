import { Router } from "express";
import * as configuracionService from "./configuracion.service.js";

const router = Router();

// GET /configuraciones?tipo=precio_hora
router.get("/", async (req, res) => {
  try {
    res.json(await configuracionService.getAll(req.query.tipo));
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    res.json(await configuracionService.getById(req.params.id));
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
});

router.post("/", async (req, res) => {
  try {
    res.status(201).json(await configuracionService.create(req.body));
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    res.json(await configuracionService.update(req.params.id, req.body));
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    res.json(await configuracionService.remove(req.params.id));
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
});

export default router;

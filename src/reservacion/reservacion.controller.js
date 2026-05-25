import { Router } from "express";
import * as reservacionService from "./reservacion.service.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    res.json(await reservacionService.getAll());
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    res.json(await reservacionService.getById(req.params.id));
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
});

router.post("/", async (req, res) => {
  try {
    res.status(201).json(await reservacionService.create(req.body));
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
});

router.patch("/:id/confirmar", async (req, res) => {
  try {
    res.json(await reservacionService.confirmar(req.params.id, req.body));
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
});

router.patch("/:id/cancelar", async (req, res) => {
  try {
    res.json(await reservacionService.cancelar(req.params.id, req.body));
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    res.json(await reservacionService.update(req.params.id, req.body));
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await reservacionService.remove(req.params.id);
    res.json({ message: "Reservación eliminada" });
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
});

export default router;

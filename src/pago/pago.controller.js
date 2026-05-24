import { Router } from "express";
import * as pagoService from "./pago.service.js";

const router = Router();

// GET /pagos?estado=pendiente
router.get("/", async (req, res) => {
  try {
    res.json(await pagoService.getAll(req.query.estado));
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    res.json(await pagoService.getById(req.params.id));
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
});

router.post("/", async (req, res) => {
  try {
    res.status(201).json(await pagoService.create(req.body));
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    res.json(await pagoService.update(req.params.id, req.body));
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    res.json(await pagoService.remove(req.params.id));
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
});

export default router;

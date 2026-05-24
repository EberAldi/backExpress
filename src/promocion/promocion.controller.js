import { Router } from "express";
import * as promocionService from "./promocion.service.js";

const router = Router();

// GET /promociones?activas=true
router.get("/", async (req, res) => {
  try {
    const soloActivas = req.query.activas === "true";
    res.json(await promocionService.getAll(soloActivas));
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    res.json(await promocionService.getById(req.params.id));
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
});

router.post("/", async (req, res) => {
  try {
    res.status(201).json(await promocionService.create(req.body));
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    res.json(await promocionService.update(req.params.id, req.body));
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    res.json(await promocionService.remove(req.params.id));
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
});

export default router;

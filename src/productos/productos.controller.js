import { Router } from "express";
import * as productoService from "./productos.service.js"

const router = Router();

router.get("/", async (req, res) => {
  try {
    res.json(await productoService.getAll());
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    res.json(await productoService.getById(Number(req.params.id)));
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
});

router.post("/", async (req, res) => {
  try {
    res.status(201).json(await productoService.create(req.body));
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    res.json(await productoService.update(Number(req.params.id), req.body));
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await productoService.remove(Number(req.params.id));
    res.json({ message: "Producto eliminado" });
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
});

// Ajustar stock manualmente — body: { cantidad: 10 } o { cantidad: -3 }
router.patch("/:id/stock", async (req, res) => {
  try {
    res.json(await productoService.ajustarStock(Number(req.params.id), req.body.cantidad));
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
});

export default router;
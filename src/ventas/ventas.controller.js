import { Router } from "express";
import * as ventaService from "./ventas.service.js"
const router = Router();

router.get("/", async (req, res) => {
  try {
    res.json(await ventaService.getAll());
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
});

// Ventas asociadas a una sesión
router.get("/sesion/:sesionId", async (req, res) => {
  try {
    res.json(await ventaService.getBySesion(Number(req.params.sesionId)));
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

/*
  POST /ventas
  body: {
    empleadoId: 1,
    sesionId: 3,       (opcional)
    items: [
      { productoId: 1, cantidad: 2 },
      { productoId: 4, cantidad: 1 }
    ]
  }
*/
router.post("/", async (req, res) => {
  try {
    res.status(201).json(await ventaService.create(req.body));
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
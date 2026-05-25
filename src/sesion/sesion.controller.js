import { Router } from "express";
import * as sesionService from "./sesion.service.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    res.json(await sesionService.getAll());
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
});

router.get("/detalle", async (req, res) => {
  try {
    res.json(await sesionService.getAllDetalle());
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
});

// Sesiones activas ahora mismo — útil para el dashboard
router.get("/activas", async (req, res) => {
  try {
    res.json(await sesionService.getActivas());
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    res.json(await sesionService.getById(Number(req.params.id)));
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
});

// Abrir sesión — body: { consolaId, empleadoId }
router.post("/abrir", async (req, res) => {
  try {
    res.status(201).json(await sesionService.abrir(req.body));
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
});

// Cerrar sesión — calcula tiempo y costo automáticamente
router.patch("/:id/cerrar", async (req, res) => {
  try {
    res.json(await sesionService.cerrar(Number(req.params.id)));
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await sesionService.remove(Number(req.params.id));
    res.json({ message: "Sesión eliminada" });
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
});

// agregar tiempo
router.patch("/:id/agregar-hora", async (req, res) => {
  try {

    res.json(
      await sesionService.agregarTiempo(
        Number(req.params.id),
      )
    )

  } catch (e) {

    res.status(e.status || 500).json({
      message: e.message,
    })
  }
})

export default router;
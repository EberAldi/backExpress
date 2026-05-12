import { Router } from "express";
import * as dashboardService from "./dashboard.service.js";

const router = Router();

// STATS
router.get("/stats", async (req, res) => {
  try {
    res.json(await dashboardService.getStats());
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// RENTAS ACTIVAS
router.get("/rentas-activas", async (req, res) => {
  try {
    res.json(await dashboardService.getRentasActivas());
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// INGRESOS DEL DÍA
router.get("/ingresos", async (req, res) => {
  try {
    res.json(await dashboardService.getIngresosDia());
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// ÚLTIMAS VENTAS
router.get("/ultimas-ventas", async (req, res) => {
  try {
    res.json(await dashboardService.getUltimasVentas());
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
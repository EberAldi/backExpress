// routes/consolas.js
import { Router } from "express";
import { AppDataSource } from "../data-source.js";
const router = Router();
const consolaRepo = AppDataSource.getRepository("Consola");
const controlRepo = AppDataSource.getRepository("Control");

// GET /consolas — trae todas con sus controles
router.get("/consolas", async (req, res) => {
  try {
    const consolas = await consolaRepo.find({
      relations: { controles: true },
    });
    res.json(consolas);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /consolas — crea consola + sus controles
router.post("/consolas", async (req, res) => {
  try {
    const { nombre, marca, estado, precioPorHora, cantidadControles = 0 } = req.body;

    const consola = consolaRepo.create({ nombre, marca, estado, precioPorHora });
    await consolaRepo.save(consola);

    if (cantidadControles > 0) {
      const controles = Array.from({ length: cantidadControles }, () =>
        controlRepo.create({ consola })
      );
      await controlRepo.save(controles);
    }

    const result = await consolaRepo.findOne({
      where: { id: consola.id },
      relations: { controles: true },
    });

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
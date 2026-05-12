// routes/consolas.js
import { Router } from "express";
import { AppDataSource } from "../data-source.js";

const router = Router();

const consolaRepo = () => AppDataSource.getRepository("Consola");
const controlRepo = () => AppDataSource.getRepository("Control");

// GET /consolas
router.get("/", async (req, res) => {
  try {
    const consolas = await consolaRepo().find({
      relations: { controles: true },
    });
    res.json(consolas);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /consolas
// body: { nombre, marca, precioPorHora, controles: [{ estado }] }
router.post("/", async (req, res) => {
  try {
    const { nombre, marca, precioPorHora, controles = [] } = req.body;

    const consola = consolaRepo().create({ nombre, marca, precioPorHora });
    await consolaRepo().save(consola);

    // Crear cada control con su estado individual
    if (controles.length > 0) {
      const nuevosControles = controles.map((ctrl) =>
        controlRepo().create({
          estado: ctrl.estado ?? "disponible",
          consola,
        })
      );
      await controlRepo().save(nuevosControles);
    }

    const result = await consolaRepo().findOne({
      where: { id: consola.id },
      relations: { controles: true },
    });
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
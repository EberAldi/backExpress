import { Router } from "express";
import * as userService from "./user.service.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    res.json(await userService.getAll());
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    res.json(await userService.getById(Number(req.params.id)));
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
});

router.post("/", async (req, res) => {
  try {
    res.status(201).json(await userService.create(req.body));
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    res.json(await userService.update(Number(req.params.id), req.body));
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await userService.remove(Number(req.params.id));
    res.json({ message: "Usuario eliminado" });
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
});

export default router;
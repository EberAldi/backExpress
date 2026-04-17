import { Router } from "express";
const router = Router();
import {createUser} from "./user.service"

router.post("/users", async (req, res) => {
  try {
    const user = await createUser(req.body);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
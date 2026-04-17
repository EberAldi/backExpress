import { Router } from "express";
const router = Router();
import { compare } from "bcrypt";
import { sign } from "jsonwebtoken";
import { findByEmail } from "../user/user.service";



router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await findByEmail(email);

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const valid = await compare(password, user.password);

    if (!valid) {
      return res.status(401).json({ message: "Contraseña incorrecta" });
    }

    const token = sign(
      { id: user.id, email: user.email },
      process.env.SECRET_KEY,
      { expiresIn: "1h" }
    );

    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
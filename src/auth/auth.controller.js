import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { findByEmail } from "../user/user.service.js";
import { findByEmail as findClienteByEmail } from "../cliente/cliente.service.js";
import passport from "./google.strategy.js";
const router = Router();

export const tokenBlacklist = new Set();

// Login para empleados (users con rol)
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await findByEmail(email);

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return res.status(401).json({ message: "Contraseña incorrecta" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, rol: user.rol },
      process.env.SECRET_KEY,
      { expiresIn: "1h" }
    );

    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login exclusivo para clientes
router.post("/cliente/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const cliente = await findClienteByEmail(email);

    if (!cliente) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }

    if (!cliente.password) {
      return res.status(401).json({ message: "Este cliente no tiene contraseña configurada" });
    }

    const valid = await bcrypt.compare(password, cliente.password);

    if (!valid) {
      return res.status(401).json({ message: "Contraseña incorrecta" });
    }

    const token = jwt.sign(
      { id: cliente.id, email: cliente.email, nombre: cliente.nombre, rol: "cliente" },
      process.env.SECRET_KEY,
      { expiresIn: "8h" }
    );

    res.json({ token, cliente: { id: cliente.id, nombre: cliente.nombre, email: cliente.email } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Logout (invalida el token en memoria)
router.post("/logout", (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    tokenBlacklist.add(authHeader.split(" ")[1]);
  }
  res.json({ message: "Sesión cerrada correctamente" });
});

// ── Google OAuth ─────────────────────────────────────────────

// Paso 1: redirigir a Google
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,   // no usamos sesiones, usamos JWT
  })
);

// Paso 2: Google regresa aquí con el código
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=google_failed`,
  }),
  (req, res) => {
    // req.user es el User que devolvió la estrategia
    const token = jwt.sign(
      {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name,
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    // Mandamos el token al frontend por query param (simple para proyecto)
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
  }
);

export default router;
import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { findByEmail } from "../user/user.service.js";
import { findByEmail as findClienteByEmail } from "../cliente/cliente.service.js";
import { findOrCreateFromAuth0 } from "./auth0.service.js";

const router = Router();

export const tokenBlacklist = new Set();

// ── Empleados ──────────────────────────────────────────────────

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await findByEmail(email);
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: "Contraseña incorrecta" });

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

// ── Clientes ───────────────────────────────────────────────────

router.post("/cliente/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const cliente = await findClienteByEmail(email);
    if (!cliente)
      return res.status(404).json({ message: "Cliente no encontrado" });

    if (!cliente.password)
      return res
        .status(401)
        .json({ message: "Este cliente no tiene contraseña configurada" });

    const valid = await bcrypt.compare(password, cliente.password);
    if (!valid) return res.status(401).json({ message: "Contraseña incorrecta" });

    const token = jwt.sign(
      { id: cliente.id, email: cliente.email, nombre: cliente.nombre, rol: "cliente" },
      process.env.SECRET_KEY,
      { expiresIn: "8h" }
    );

    res.json({
      token,
      cliente: { id: cliente.id, nombre: cliente.nombre, email: cliente.email },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── Logout ─────────────────────────────────────────────────────

router.post("/logout", (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    tokenBlacklist.add(authHeader.split(" ")[1]);
  }
  res.json({ message: "Sesión cerrada correctamente" });
});

// ── Auth0 Universal Login ──────────────────────────────────────

/**
 * GET /api/auth/auth0
 * Inicia el flujo Auth0 (Google, email, etc. según lo configurado en el tenant).
 * Después del callback, Auth0 redirige al navegador a /api/auth/auth0/complete.
 */
router.get("/auth0", (req, res) => {
  if (!req.oidc) {
    return res.status(503).json({ message: "Auth0 no está configurado en este servidor" });
  }
  res.oidc.login({ returnTo: `${process.env.BASE_URL}/api/auth/callback` });
});

// GET /api/auth/callback
// Auth0 redirige aquí después del login. Crea/encuentra el Cliente y emite JWT.
router.get("/callback", async (req, res) => {
  try {
    if (!req.oidc || !req.oidc.isAuthenticated()) {
      return res.status(401).json({ success: false, message: "Autenticación con Auth0 fallida" });
    }

    const { sub, email, name, picture } = req.oidc.user;
    const cliente = await findOrCreateFromAuth0({ sub, email, name, picture });

    const token = jwt.sign(
      { id: cliente.id, email: cliente.email, nombre: cliente.nombre, rol: "cliente" },
      process.env.SECRET_KEY,
      { expiresIn: "8h" }
    );

    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

import { AppDataSource } from "../data-source.js";

const repo = () => AppDataSource.getRepository("Cliente");

/**
 * Encuentra o crea un Cliente a partir del perfil devuelto por Auth0.
 * Auth0 maneja Google OAuth internamente, por lo que el sub tiene el formato
 * "google-oauth2|123456" para usuarios que entran con Google.
 */
export async function findOrCreateFromAuth0({ sub, email, name, picture }) {
  // 1. Ya tiene cuenta vinculada a Auth0
  let cliente = await repo().findOne({ where: { auth0Id: sub, isActive: true } });
  if (cliente) return cliente;

  // 2. Existe por email → vincular sin duplicar
  if (email) {
    cliente = await repo().findOne({ where: { email, isActive: true } });
    if (cliente) {
      cliente.auth0Id = sub;
      if (picture && !cliente.avatar) cliente.avatar = picture;
      return repo().save(cliente);
    }
  }

  // 3. Cliente nuevo
  const nuevo = repo().create({
    nombre: name ?? email ?? "Cliente",
    email: email ?? null,
    auth0Id: sub,
    avatar: picture ?? null,
  });
  return repo().save(nuevo);
}

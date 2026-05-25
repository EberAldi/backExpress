import { AppDataSource } from "../data-source.js";
import bcrypt from "bcrypt";

const userRepository = AppDataSource.getRepository("User");
const repo = () => AppDataSource.getRepository("User");
export const createUser = async (data) => {
  const hashedPassword = await bcrypt.hash(data.password, 10);

  const user = userRepository.create({
    name: data.name,
    email: data.email,
    password: hashedPassword,
  });

  return await userRepository.save(user);
};

export const findByEmail = async (email) => {
  return await userRepository.findOneBy({ email });
};

export async function getAll() {
  // Nunca regresar el password
  return repo().find({ select: ["id", "name", "email", "googleId", "avatar"] });
}
 
export async function getById(id) {
  const user = await repo().findOne({
    where: { id },
    select: ["id", "name", "email", "googleId", "avatar"],
  });
  if (!user) throw { status: 404, message: "Usuario no encontrado" };
  return user;
}
 
export async function create(data) {
  const existe = await repo().findOne({ where: { email: data.email } });
  if (existe) throw { status: 409, message: "El email ya está registrado" };
 
  const hash = await bcrypt.hash(data.password, 10);
  const user = repo().create({ ...data, password: hash });
  const saved = await repo().save(user);
 
  const { password, ...sinPassword } = saved;
  return sinPassword;
}
 
export async function update(id, data) {
  const user = await repo().findOne({ where: { id } });
  if (!user) throw { status: 404, message: "Usuario no encontrado" };
 
  // Si manda nuevo password, hashearlo
  if (data.password) {
    data.password = await bcrypt.hash(data.password, 10);
  }
 
  Object.assign(user, data);
  const saved = await repo().save(user);
  const { password, ...sinPassword } = saved;
  return sinPassword;
}
 
export async function remove(id) {
  const user = await repo().findOne({ where: { id } });
  if (!user) throw { status: 404, message: "Usuario no encontrado" };
  return repo().remove(user);
}

export async function savePushSubscription(id, subscription) {
  const user = await repo().findOne({ where: { id } });
  if (!user) throw { status: 404, message: "Usuario no encontrado" };
  await repo().update(id, { pushSubscription: JSON.stringify(subscription) });
}
 

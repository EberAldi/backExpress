import { AppDataSource } from "../data-source.js";
import bcrypt from "bcrypt";

const userRepository = AppDataSource.getRepository("User");

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
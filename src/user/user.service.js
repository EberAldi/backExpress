import { AppDataSource } from "../data-source";
import { hash } from "bcrypt";

const userRepository = AppDataSource.getRepository("User");

const createUser = async (data) => {
  const hashedPassword = await hash(data.password, 10);

  const user = userRepository.create({
    name: data.name,
    email: data.email,
    password: hashedPassword,
  });

  return await userRepository.save(user);
};

const findByEmail = async (email) => {
  return await userRepository.findOneBy({ email });
};

export default {
  createUser,
  findByEmail,
};
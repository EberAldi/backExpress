import { AppDataSource } from "../data-source.js";

const repo = () => AppDataSource.getRepository("Producto");

export async function getAll() {
  return repo().find();
}

export async function getById(id) {
  const producto = await repo().findOne({ where: { id } });
  if (!producto) throw { status: 404, message: "Producto no encontrado" };
  return producto;
}

export async function create(data) {
  const producto = repo().create(data);
  return repo().save(producto);
}

export async function update(id, data) {
  const producto = await getById(id);
  Object.assign(producto, data);
  return repo().save(producto);
}

export async function remove(id) {
  const producto = await getById(id);
  return repo().remove(producto);
}

export async function ajustarStock(id, cantidad) {
  // cantidad positiva = entrada, negativa = salida
  const producto = await getById(id);
  const nuevoStock = producto.stock + cantidad;
  if (nuevoStock < 0) throw { status: 400, message: "Stock insuficiente" };
  return update(id, { stock: nuevoStock });
}
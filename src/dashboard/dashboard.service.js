import { AppDataSource } from "../data-source.js";

const sesionRepo = () => AppDataSource.getRepository("Sesion");
const ventaRepo = () => AppDataSource.getRepository("Venta");
const detalleRepo = () => AppDataSource.getRepository("DetalleVenta");
const consolaRepo = () => AppDataSource.getRepository("Consola");

// ─────────────────────────────
// STATS GENERALES
// ─────────────────────────────
export async function getStats() {

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const sesiones = await sesionRepo().find();

  const ventas = await ventaRepo().find({
    relations: ["detalles"],
  });

  const consolasActivas = await consolaRepo().count({
    where: { estado: "ocupada" },
  });

  const rentasHoy = sesiones.filter((s) => {
    return new Date(s.inicio) >= hoy;
  }).length;

  const clientesHoy = sesiones.filter((s) => {
    return new Date(s.inicio) >= hoy;
  }).length;

  const productosVendidos = ventas.reduce((acc, v) => {
    return acc + v.detalles.reduce((a, d) => a + d.cantidad, 0);
  }, 0);

  return {
    consolasActivas,
    rentasHoy,
    clientesHoy,
    productosVendidos,
  };
}

// ─────────────────────────────
// RENTAS ACTIVAS
// ─────────────────────────────
export async function getRentasActivas() {

  const sesiones = await sesionRepo().find({
    where: { estado: "activa" },
    relations: ["consola"],
  });

  return sesiones.map((s) => ({
    id: s.id,
    consola: s.consola?.nombre || "Sin consola",
    inicio: new Date(s.inicio).toLocaleTimeString(),
    duracion: `${s.duracionHoras}h`,
    monto: s.consola?.precioPorHora * s.duracionHoras,
  }));
}

// ─────────────────────────────
// INGRESOS DEL DÍA
// ─────────────────────────────
export async function getIngresosDia() {

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const sesiones = await sesionRepo().find();
  const ventas = await ventaRepo().find();

  const ingresosSesiones = sesiones
    .filter(s => s.estado === "cerrada")
    .reduce((acc, s) => acc + Number(s.costoConsola || 0), 0);

  const ingresosVentas = ventas
    .reduce((acc, v) => acc + Number(v.total), 0);

  return {
    total: ingresosSesiones + ingresosVentas,
    sesiones: ingresosSesiones,
    ventas: ingresosVentas,
  };
}

// ─────────────────────────────
// ÚLTIMAS VENTAS
// ─────────────────────────────
export async function getUltimasVentas() {

  const ventas = await ventaRepo().find({
    relations: ["detalles", "detalles.producto"],
    order: { id: "DESC" },
    take: 5,
  });

  const result = [];

  for (const venta of ventas) {

    for (const d of venta.detalles) {

      result.push({
        id: venta.id,
        producto: d.producto?.nombre,
        cantidad: d.cantidad,
        total: d.subtotal,
      });
    }
  }

  return result.slice(0, 10);
}
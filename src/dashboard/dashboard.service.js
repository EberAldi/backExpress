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
// VENTAS ÚLTIMOS 7 DÍAS
// ─────────────────────────────
export async function getVentasSemana() {
  const hoy = new Date();
  hoy.setHours(23, 59, 59, 999);

  const hace7dias = new Date(hoy);
  hace7dias.setDate(hoy.getDate() - 6);
  hace7dias.setHours(0, 0, 0, 0);

  const dias = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(hace7dias);
    d.setDate(hace7dias.getDate() + i);
    return d;
  });

  const [sesiones, ventas] = await Promise.all([
    sesionRepo()
      .createQueryBuilder("s")
      .where("s.inicio >= :desde", { desde: hace7dias })
      .andWhere("s.inicio <= :hasta", { hasta: hoy })
      .andWhere("s.estado = 'cerrada'")
      .getMany(),
    ventaRepo()
      .createQueryBuilder("v")
      .where("v.creadoEn >= :desde", { desde: hace7dias })
      .andWhere("v.creadoEn <= :hasta", { hasta: hoy })
      .getMany(),
  ]);

  const etiquetas = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  const datos = dias.map((dia) => {
    const siguiente = new Date(dia);
    siguiente.setHours(23, 59, 59, 999);

    const ingresoSesiones = sesiones
      .filter((s) => {
        const f = new Date(s.inicio);
        return f >= dia && f <= siguiente;
      })
      .reduce((acc, s) => acc + Number(s.costoConsola || 0), 0);

    const ingresoVentas = ventas
      .filter((v) => {
        const f = new Date(v.creadoEn);
        return f >= dia && f <= siguiente;
      })
      .reduce((acc, v) => acc + Number(v.total || 0), 0);

    return {
      fecha: dia.toISOString().split("T")[0],
      dia: etiquetas[dia.getDay()],
      rentas: parseFloat(ingresoSesiones.toFixed(2)),
      productos: parseFloat(ingresoVentas.toFixed(2)),
      total: parseFloat((ingresoSesiones + ingresoVentas).toFixed(2)),
    };
  });

  return {
    labels: datos.map((d) => d.dia),
    datasets: [
      {
        label: "Rentas",
        data: datos.map((d) => d.rentas),
      },
      {
        label: "Productos",
        data: datos.map((d) => d.productos),
      },
    ],
    detalle: datos,
  };
}

// ─────────────────────────────
// CONSOLAS MÁS RENTADAS
// ─────────────────────────────
export async function getConsolasTop() {
  const resultado = await sesionRepo()
    .createQueryBuilder("s")
    .leftJoin("s.consola", "c")
    .select("c.id", "consolaid")
    .addSelect("c.nombre", "nombre")
    .addSelect("COUNT(s.id)", "totalrentas")
    .addSelect("SUM(s.costoConsola)", "ingresototal")
    .addSelect("SUM(s.duracionHoras)", "horastotales")
    .where("s.estado = 'cerrada'")
    .groupBy("c.id")
    .addGroupBy("c.nombre")
    .orderBy("totalrentas", "DESC")
    .getRawMany();

  const datos = resultado.map((r) => ({
    consolaId: r.consolaid,
    nombre: r.nombre,
    totalRentas: Number(r.totalrentas),
    ingresoTotal: parseFloat(Number(r.ingresototal || 0).toFixed(2)),
    horasTotales: Number(r.horastotales || 0),
  }));

  return {
    labels: datos.map((d) => d.nombre),
    datasets: [
      {
        label: "Rentas",
        data: datos.map((d) => d.totalRentas),
      },
    ],
    detalle: datos,
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
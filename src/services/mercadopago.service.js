import { MercadoPagoConfig, Preference } from "mercadopago";

const isSandbox = process.env.MP_SANDBOX === "true";

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

// ── Preferencia para cobrar una sesión ────────────────────────
export async function crearPreferenciaSesion({ sesion, consola, total, pagoId }) {
  const preference = new Preference(client);

  const backUrls = {
    success: `${process.env.FRONTEND_URL}/pago/exito`,
    failure: `${process.env.FRONTEND_URL}/pago/error`,
    pending: `${process.env.FRONTEND_URL}/pago/pendiente`,
  };

  const esLocal = (process.env.FRONTEND_URL ?? "").includes("localhost");

  const body = {
    items: [
      {
        id: String(sesion.id),
        title: `Renta ${consola.nombre}`,
        description: `Sesión de juego - ${sesion.duracionHoras} hora(s)`,
        quantity: 1,
        currency_id: "MXN",
        unit_price: Number(total),
      },
    ],
    external_reference: pagoId,
    notification_url: `${process.env.BASE_URL}/api/pagos/webhook`,
    back_urls: backUrls,
    ...(esLocal ? {} : { auto_return: "approved" }),
    payment_methods: { installments: 12 },
    metadata: { sesionId: sesion.id, pagoId, consola: consola.nombre },
  };

  const result = await preference.create({ body });

  const payUrl = isSandbox ? result.sandbox_init_point : result.init_point;
  return {
    preferenceId: result.id,
    initPoint: result.init_point,
    sandboxInitPoint: result.sandbox_init_point,
    qr: `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(payUrl)}`,
  };
}

// ── Preferencia genérica (POS / venta directa) ────────────────
export async function crearPreferenciaGenerica({ total, titulo, pagoId, ventaId = null }) {
  const preference = new Preference(client);

  const esLocal = (process.env.FRONTEND_URL ?? "").includes("localhost");

  const body = {
    items: [
      {
        title: titulo,
        quantity: 1,
        currency_id: "MXN",
        unit_price: Number(total),
      },
    ],
    external_reference: pagoId,
    notification_url: `${process.env.BASE_URL}/api/pagos/webhook`,
    back_urls: {
      success: `${process.env.FRONTEND_URL}/pago/exito`,
      failure: `${process.env.FRONTEND_URL}/pago/error`,
      pending: `${process.env.FRONTEND_URL}/pago/pendiente`,
    },
    ...(esLocal ? {} : { auto_return: "approved" }),
  };

  const result = await preference.create({ body });

  const payUrl = isSandbox ? result.sandbox_init_point : result.init_point;
  return {
    preferenceId: result.id,
    initPoint: result.init_point,
    sandboxInitPoint: result.sandbox_init_point,
    qr: `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(payUrl)}`,
  };
}

// ── Consultar estado de un pago ───────────────────────────────
export async function obtenerEstadoPago(paymentId) {
  const response = await fetch(
    `https://api.mercadopago.com/v1/payments/${paymentId}`,
    { headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` } }
  );
  if (!response.ok) throw new Error("No se pudo obtener el pago");
  return response.json();
}

import {
  MercadoPagoConfig,
  Preference,
} from "mercadopago";

const client = new MercadoPagoConfig({
  accessToken:
    process.env.MP_ACCESS_TOKEN,
});

export async function crearPreferenciaSesion({
  sesion,
  consola,
  total,
}) {

  const preference =
    new Preference(client);

  const body = {

    items: [
      {
        id: String(sesion.id),

        title:
          `Renta ${consola.nombre}`,

        description:
          `Sesión de juego - ${sesion.duracionHoras} hora(s)`,

        quantity: 1,

        currency_id: "MXN",

        unit_price: Number(total),
      },
    ],

    external_reference:
      String(sesion.id),

    notification_url:
      `${process.env.BACKEND_URL}/pagos/webhook`,

    back_urls: {

      success:
        `${process.env.FRONTEND_URL}/pago/exito`,

      failure:
        `${process.env.FRONTEND_URL}/pago/error`,

      pending:
        `${process.env.FRONTEND_URL}/pago/pendiente`,
    },

    auto_return: "approved",

    payment_methods: {

      excluded_payment_types: [],

      installments: 12,
    },

    metadata: {
      sesionId: sesion.id,
      consola: consola.nombre,
    },
  };

  const result =
    await preference.create({
      body,
    });

  return {

    preferenceId: result.id,

    initPoint:
      result.init_point,

    sandboxInitPoint:
      result.sandbox_init_point,

    qr:
      `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(result.init_point)}`,
  };
}
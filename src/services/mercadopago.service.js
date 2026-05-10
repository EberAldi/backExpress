// src/services/mercadopago.service.js
import { MercadoPagoConfig, Preference } from "mercadopago";

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

export async function crearPreferenciaSesion(sesion, consola) {
  const preference = new Preference(client);

  const body = {
    items: [
      {
        title: `Sesión ${consola.nombre} - ${sesion.totalMinutos} min`,
        quantity: 1,
        unit_price: Number(sesion.costoConsola),
        currency_id: "MXN",
      },
    ],
    external_reference: String(sesion.id),   // para identificarla en el webhook
    notification_url: `${process.env.BACKEND_URL}/pagos/webhook`,
    back_urls: {
      success: `${process.env.FRONTEND_URL}/sesiones/${sesion.id}/pago-exitoso`,
      failure: `${process.env.FRONTEND_URL}/sesiones/${sesion.id}/pago-fallido`,
    },
    auto_return: "approved",
  };

  const result = await preference.create({ body });

  return {
    preferenceId: result.id,
    initPoint: result.init_point,        // link de pago normal
    sandboxInitPoint: result.sandbox_init_point,  // para pruebas
  };
}
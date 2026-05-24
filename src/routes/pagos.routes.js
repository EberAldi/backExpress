import { Router } from "express";

import crypto from "crypto";

import { AppDataSource }
from "../data-source.js";

import {
  crearPreferenciaSesion,
  crearPreferenciaGenerica,
  obtenerEstadoPago,
} from "../services/mercadopago.service.js";

const router = Router();


// ─────────────────────────────
// CREAR PAGO SESIÓN
// ─────────────────────────────
router.post(
  "/sesiones/:id/pago",
  async (req, res) => {

    try {

      const sesionRepo =
        AppDataSource.getRepository(
          "Sesion"
        );

      const sesion =
        await sesionRepo.findOne({

          where: {
            id: Number(
              req.params.id
            ),
          },

          relations: [
            "consola",
          ],
        });

      if (!sesion) {

        return res.status(404)
          .json({
            message:
              "Sesión no encontrada",
          });
      }

      const total =
        Number(
          (
            sesion.duracionHoras *
            sesion.consola.precioPorHora
          ).toFixed(2)
        );

      const pago =
        await crearPreferenciaSesion({

          sesion,

          consola:
            sesion.consola,

          total,
        });

      sesion.mpPreferenceId =
        pago.preferenceId;

      await sesionRepo.save(
        sesion
      );

      return res.json({

        ok: true,

        total,

        preferenceId:
          pago.preferenceId,

        initPoint:
          pago.initPoint,

        sandboxInitPoint:
          pago.sandboxInitPoint,

        qr:
          pago.qr,
      });

    } catch (error) {

      console.error(error);

      return res.status(500)
        .json({
          message:
            error.message,
        });
    }
  }
);


// ─────────────────────────────
// WEBHOOK
// ─────────────────────────────
router.post(
  "/webhook",
  async (req, res) => {

    try {

      const {
        type,
        data,
      } = req.body;

      if (
        type !== "payment"
      ) {

        return res.sendStatus(
          200
        );
      }

      const xSignature =
        req.headers[
          "x-signature"
        ];

      const xRequestId =
        req.headers[
          "x-request-id"
        ];

      if (
        xSignature &&
        process.env
          .MP_WEBHOOK_SECRET
      ) {

        const [
          tsPart,
          v1Part,
        ] =
          xSignature.split(",");

        const ts =
          tsPart.split("=")[1];

        const v1 =
          v1Part.split("=")[1];

        const manifest =
          `id:${data.id};request-id:${xRequestId};ts:${ts};`;

        const hash =
          crypto
            .createHmac(
              "sha256",
              process.env
                .MP_WEBHOOK_SECRET
            )
            .update(
              manifest
            )
            .digest("hex");

        if (hash !== v1) {

          return res.sendStatus(
            401
          );
        }
      }

      const response =
        await fetch(
          `https://api.mercadopago.com/v1/payments/${data.id}`,
          {
            headers: {
              Authorization:
                `Bearer ${process.env.MP_ACCESS_TOKEN}`,
            },
          }
        );

      const payment =
        await response.json();

      if (
        payment.status !==
        "approved"
      ) {

        return res.sendStatus(
          200
        );
      }

      const sesionRepo =
        AppDataSource.getRepository(
          "Sesion"
        );

      const sesion =
        await sesionRepo.findOne({
          where: {
            id: Number(
              payment.external_reference
            ),
          },
        });

      if (!sesion) {

        return res.sendStatus(
          404
        );
      }

      sesion.pagoEstado =
        "pagado";

      await sesionRepo.save(
        sesion
      );

      console.log(
        "PAGO APROBADO:",
        sesion.id
      );

      return res.sendStatus(
        200
      );

    } catch (error) {

      console.error(
        "WEBHOOK ERROR:",
        error
      );

      return res.sendStatus(
        500
      );
    }
  }
);


// ─────────────────────────────
// EFECTIVO
// ─────────────────────────────
router.patch(
  "/sesiones/:id/efectivo",
  async (req, res) => {

    try {

      const repo =
        AppDataSource.getRepository(
          "Sesion"
        );

      const sesion =
        await repo.findOne({
          where: {
            id: Number(
              req.params.id
            ),
          },
        });

      if (!sesion) {

        return res.status(404)
          .json({
            message:
              "Sesión no encontrada",
          });
      }

      sesion.pagoEstado =
        "efectivo";

      await repo.save(
        sesion
      );

      return res.json({
        ok: true,
        sesion,
      });

    } catch (error) {

      return res.status(500)
        .json({
          message:
            error.message,
        });
    }
  }
);


router.post('/qr', async (req, res) => {

  try {

    const { total, titulo } = req.body

    const pago = await crearPreferenciaGenerica({
      total,
      titulo,
    })

    return res.json({
      ok: true,
      qr: pago.qr,
      initPoint: pago.initPoint,
      paymentId: pago.paymentId,
    })

  } catch (error) {

    return res.status(500).json({
      message: error.message,
    })
  }
})

router.post('/efectivo', async (req, res) => {

  return res.json({
    ok: true,
    status: 'approved',
  })
})


// ─────────────────────────────
// ESTADO PAGO
// ─────────────────────────────
router.get(
  '/estado/:paymentId',

  async (req, res) => {

    try {

      const payment =
        await obtenerEstadoPago(
          req.params.paymentId
        )

      return res.json({
        status:
          payment.status,
      })

    } catch (error) {

      return res.status(500)
        .json({
          message:
            error.message,
        })
    }
  }
)
export default router;


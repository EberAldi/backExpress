import * as webpush from 'web-push';
import { In, Not, IsNull } from 'typeorm';
import { User } from '../user/entity/user.entity';

export class WebPushService {
  constructor(userRepository) {
    this.userRepository = userRepository;
    
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT,
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
  }

  async suscribirUsuario(userId, subscription) {
    // Guardar subscription en la DB
    await this.userRepository.update(userId, {
      pushSubscription: JSON.stringify(subscription)
    });
  }

  async notificarNuevaReservacion(reservacion) {
    // Notificar a todos los empleados/admins activos
    const usuarios = await this.userRepository.find({
      where: { 
        rol: In(['admin', 'gerente', 'empleado']),
        activo: true,
        pushSubscription: Not(IsNull())
      }
    });

    const payload = JSON.stringify({
      title: '🎮 Nueva Reservación',
      body: `${reservacion.consola.nombre} - ${new Date(reservacion.fechaInicio).toLocaleTimeString('es-MX')}`,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      data: {
        url: `/dashboard/reservaciones/${reservacion.id}`,
        reservacionId: reservacion.id
      },
      actions: [
        { action: 'ver', title: 'Ver detalles' },
        { action: 'cerrar', title: 'Cerrar' }
      ]
    });

    const promesas = usuarios.map(async (user) => {
      try {
        const subscription = JSON.parse(user.pushSubscription);
        await webpush.sendNotification(subscription, payload);
      } catch (error) {
        console.error(`Error enviando push a usuario ${user.id}:`, error);
        // Si falla (subscription expiró), limpiar
        if (error.statusCode === 410) {
          await this.userRepository.update(user.id, { pushSubscription: null });
        }
      }
    });

    await Promise.allSettled(promesas);
  }

  async notificarReservacionProxima(reservacion) {
    // 30 minutos antes
    const usuarios = await this.userRepository.find({
      where: { 
        rol: In(['admin', 'gerente', 'empleado']),
        activo: true,
        pushSubscription: Not(IsNull())
      }
    });

    const payload = JSON.stringify({
      title: '⏰ Reservación en 30 minutos',
      body: `${reservacion.cliente.nombre} - ${reservacion.consola.nombre}`,
      icon: '/icon-192x192.png',
      tag: `reservacion-${reservacion.id}`, // Para reemplazar notificación anterior
      requireInteraction: true, // No se auto-cierra
      data: {
        url: `/dashboard/reservaciones/${reservacion.id}`,
        reservacionId: reservacion.id
      }
    });

    const promesas = usuarios.map((user) => {
      const subscription = JSON.parse(user.pushSubscription);
      return webpush.sendNotification(subscription, payload);
    });

    await Promise.allSettled(promesas);
  }

  async notificarCancelacion(reservacion) {
    const usuarios = await this.userRepository.find({
      where: { 
        rol: In(['admin', 'gerente']),
        activo: true,
        pushSubscription: Not(IsNull())
      }
    });

    const payload = JSON.stringify({
      title: '❌ Reservación cancelada',
      body: `${reservacion.cliente.nombre} canceló ${reservacion.consola.nombre}`,
      icon: '/icon-192x192.png',
      data: {
        url: `/dashboard/reservaciones`,
        tipo: 'cancelacion'
      }
    });

    const promesas = usuarios.map((user) => {
      const subscription = JSON.parse(user.pushSubscription);
      return webpush.sendNotification(subscription, payload);
    });

    await Promise.allSettled(promesas);
  }
}
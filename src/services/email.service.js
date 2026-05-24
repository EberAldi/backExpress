import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  async enviarConfirmacionReservacion(cliente, reservacion) {
    const fecha = new Date(reservacion.fechaInicio);
    const hora = fecha.toLocaleTimeString('es-MX', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    const dia = fecha.toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const html = this.generarTemplateConfirmacion({
      nombreCliente: cliente.nombre,
      nombreConsola: reservacion.consola.nombre,
      dia,
      hora,
      duracion: reservacion.duracionHoras,
      total: reservacion.costoTotal,
      idReservacion: reservacion.id
    });

    try {
      await this.resend.emails.send({
        from: 'Cyber Gaming <onboarding@resend.dev>', // Cambiar por tu dominio
        to: cliente.email,
        subject: `✅ Reservación confirmada - ${reservacion.consola.nombre}`,
        html
      });
      
      console.log(`✅ Email enviado a ${cliente.email}`);
    } catch (error) {
      console.error('Error enviando email:', error);
      throw error;
    }
  }

  async enviarCancelacionReservacion(cliente, reservacion, motivo) {
    const html = this.generarTemplateCancelacion({
      nombreCliente: cliente.nombre,
      nombreConsola: reservacion.consola.nombre,
      fechaOriginal: new Date(reservacion.fechaInicio).toLocaleDateString('es-MX'),
      motivo: motivo || 'No especificado'
    });

    await this.resend.emails.send({
      from: 'Cyber Gaming <onboarding@resend.dev>',
      to: cliente.email,
      subject: `❌ Reservación cancelada`,
      html
    });
  }

  async enviarRecordatorio24h(cliente, reservacion) {
    const fecha = new Date(reservacion.fechaInicio);
    const hora = fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

    const html = this.generarTemplateRecordatorio({
      nombreCliente: cliente.nombre,
      nombreConsola: reservacion.consola.nombre,
      hora,
      duracion: reservacion.duracionHoras
    });

    await this.resend.emails.send({
      from: 'Cyber Gaming <onboarding@resend.dev>',
      to: cliente.email,
      subject: `⏰ Recordatorio: Tu reservación es mañana`,
      html
    });
  }

  generarTemplateConfirmacion(data) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
    .card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
    .detail-label { font-weight: 600; color: #6b7280; }
    .detail-value { color: #111827; }
    .total { background: #667eea; color: white; padding: 15px; border-radius: 8px; text-align: center; font-size: 20px; font-weight: bold; margin-top: 20px; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎮 Reservación Confirmada</h1>
    </div>
    
    <div class="content">
      <p>Hola <strong>${data.nombreCliente}</strong>,</p>
      <p>Tu reservación ha sido confirmada exitosamente.</p>
      
      <div class="card">
        <h2 style="margin-top: 0; color: #667eea;">Detalles de tu reservación</h2>
        
        <div class="detail-row">
          <span class="detail-label">Consola:</span>
          <span class="detail-value">${data.nombreConsola}</span>
        </div>
        
        <div class="detail-row">
          <span class="detail-label">Fecha:</span>
          <span class="detail-value">${data.dia}</span>
        </div>
        
        <div class="detail-row">
          <span class="detail-label">Hora:</span>
          <span class="detail-value">${data.hora}</span>
        </div>
        
        <div class="detail-row" style="border-bottom: none;">
          <span class="detail-label">Duración:</span>
          <span class="detail-value">${data.duracion} hora(s)</span>
        </div>
        
        <div class="total">
          Total a pagar: $${data.total} MXN
        </div>
      </div>
      
      <p><strong>Código de reservación:</strong> #${data.idReservacion}</p>
      
      <p style="background: #fef3c7; padding: 15px; border-radius: 6px; border-left: 4px solid #f59e0b;">
        ⚠️ <strong>Importante:</strong> Por favor llega 5 minutos antes de tu hora reservada. 
        Si necesitas cancelar, hazlo con al menos 2 horas de anticipación.
      </p>
      
      <center>
        <a href="${process.env.APP_URL}/reservaciones/${data.idReservacion}" class="button">
          Ver mi reservación
        </a>
      </center>
    </div>
    
    <div class="footer">
      <p>Cyber Gaming - Tu lugar favorito para jugar</p>
      <p style="font-size: 12px; color: #9ca3af;">
        Si tienes preguntas, responde a este correo o llámanos al (951) 123-4567
      </p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  generarTemplateCancelacion(data) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #ef4444; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
    .card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>❌ Reservación Cancelada</h1>
    </div>
    
    <div class="content">
      <p>Hola <strong>${data.nombreCliente}</strong>,</p>
      <p>Tu reservación ha sido cancelada.</p>
      
      <div class="card">
        <p><strong>Consola:</strong> ${data.nombreConsola}</p>
        <p><strong>Fecha original:</strong> ${data.fechaOriginal}</p>
        <p><strong>Motivo:</strong> ${data.motivo}</p>
      </div>
      
      <p>Esperamos verte pronto. Puedes hacer una nueva reservación en cualquier momento.</p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  generarTemplateRecordatorio(data) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #f59e0b; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
    .highlight { background: #fef3c7; padding: 20px; border-radius: 8px; text-align: center; font-size: 18px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⏰ Recordatorio de Reservación</h1>
    </div>
    
    <div class="content">
      <p>Hola <strong>${data.nombreCliente}</strong>,</p>
      <p>Solo para recordarte que mañana tienes una reservación:</p>
      
      <div class="highlight">
        <strong>🎮 ${data.nombreConsola}</strong><br>
        ⏰ ${data.hora}<br>
        ⏱️ ${data.duracion} hora(s)
      </div>
      
      <p>¡Te esperamos! 🎉</p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }
}
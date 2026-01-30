# Integración con MercadoPago

Este documento describe la integración de MercadoPago Checkout Pro en el sistema de ticketing.

## Configuración

### Variables de Entorno

Copia el archivo `.env.example` a `.env` y configura las siguientes variables:

```bash
# MercadoPago Configuration
MERCADOPAGO_PUBLIC_KEY=APP_USR-912123be-7acd-4dca-996c-3b640a82473f
MERCADOPAGO_ACCESS_TOKEN=APP_USR-2731051938078402-012923-3e2cffc1d1c27c1a22f428c9caa9e3e7-3169176684
MERCADOPAGO_WEBHOOK_URL=https://your-backend-url.com/tickets/mercadopago/webhook

# Frontend URLs
FRONTEND_URL=http://localhost:5173
```

## Flujo de Integración

### 1. Creación de Preferencia de Pago

Cuando un usuario selecciona un evento y completa el formulario de compra:

```typescript
// Backend: POST /tickets
const paymentPreference = await this.mercadoPagoService.createPaymentPreference({
  id: ticketId,
  bookingReference,
  totalPrice,
  currency: 'ARS',
  quantity,
  eventTitle,
  customerEmail,
});
```

### 2. Redirección a MercadoPago

El frontend redirige al usuario al checkout de MercadoPago:

```typescript
// Frontend: Redirección
window.location.href = paymentPreference.initPoint;
```

### 3. Webhooks de Notificación

MercadoPago envía notificaciones a:

```
POST /tickets/mercadopago/webhook
```

El webhook procesa el estado del pago y actualiza el ticket:

```typescript
if (webhookData.type === 'payment') {
  const paymentId = webhookData.data.id;
  const payment = await this.mercadoPagoService.getPayment(paymentId);
  await this.ticketService.processPayment(paymentId, payment.status);
}
```

### 4. URLs de Retorno

Después del pago, MercadoPago redirige al usuario a:

- **Éxito**: `GET /tickets/mercadopago/payment/success`
- **Fallo**: `GET /tickets/mercadopago/payment/failure`  
- **Pendiente**: `GET /tickets/mercadopago/payment/pending`

Estas redirigen al frontend a las páginas correspondientes.

## Endpoints del Backend

### Tickets Controller

- `POST /tickets` - Crear ticket y preferencia de pago
- `POST /tickets/mercadopago/webhook` - Webhook de MercadoPago
- `GET /tickets/mercadopago/payment/success` - Redirección éxito
- `GET /tickets/mercadopago/payment/failure` - Redirección fallo
- `GET /tickets/mercadopago/payment/pending` - Redirección pendiente

## Componentes del Frontend

### TicketPurchase Componente

- Ruta: `/events/:id/purchase`
- Maneja el formulario de compra
- Integra el SDK de MercadoPago
- Redirige al checkout

### PaymentStatus Página

- Ruta: `/payment/:status`
- Muestra el estado del pago (éxito, fallo, pendiente)
- Proporciona retroalimentación al usuario

## Configuración en MercadoPago

1. **Crear Aplicación**: Ve a [MercadoPago Developers](https://www.mercadopago.com/developers)
2. **Configurar URLs de Retorno**:
   - Éxito: `https://your-backend-url.com/tickets/mercadopago/payment/success`
   - Fallo: `https://your-backend-url.com/tickets/mercadopago/payment/failure`
   - Pendiente: `https://your-backend-url.com/tickets/mercadopago/payment/pending`
3. **Configurar Webhook**: `https://your-backend-url.com/tickets/mercadopago/webhook`

## Pruebas

Para probar la integración:

1. Inicia el backend: `npm run start:dev`
2. Inicia el frontend: `npm run dev`
3. Navega a un evento y haz clic en "Purchase Tickets"
4. Completa el formulario y serás redirigido a MercadoPago
5. Usa las credenciales de prueba de MercadoPago

## Consideraciones de Seguridad

- El Access Token de MercadoPago está configurado como variable de entorno
- Las URLs de webhook deben ser HTTPS en producción
- Validar siempre las notificaciones de webhook
- Los tickets solo se confirman después del pago aprobado

## Soporte

Para problemas con la integración:

1. Revisa los logs del backend para errores del webhook
2. Verifica la configuración de URLs en MercadoPago
3. Confirma que las variables de entorno estén correctamente configuradas
4. Consulta la [documentación de MercadoPago](https://www.mercadopago.com/developers)

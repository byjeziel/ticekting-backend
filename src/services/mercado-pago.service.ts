import { Injectable } from '@nestjs/common';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

@Injectable()
export class MercadopagoService {
  private client: MercadoPagoConfig;

  constructor() {
    this.client = new MercadoPagoConfig({
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || 'APP_USR-2731051938078402-012923-3e2cffc1d1c27c1a22f428c9caa9e3e7-3169176684',
    });
  }

  async createPreference(ticketData: any) {
    const preference = new Preference(this.client);
    
    const items = [{
      id: ticketData.id,
      title: ticketData.eventTitle,
      quantity: ticketData.quantity,
      unit_price: ticketData.totalPrice / ticketData.quantity,
      currency_id: ticketData.currency || 'ARS',
    }];

    const result = await preference.create({
      body: {
        items: items,
        external_reference: ticketData.bookingReference,
        back_urls: {
          success: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/success`,
          failure: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/failure`,
          pending: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/pending`,
        },
        auto_return: 'approved',
        notification_url: process.env.MERCADOPAGO_WEBHOOK_URL || 'https://your-backend-url.com/tickets/mercadopago/webhook',
      },
    });

    return {
      preferenceId: result.id,
      initPoint: result.init_point,
      sandboxInitPoint: result.sandbox_init_point,
    };
  }

  async createPaymentPreference(ticketData: any) {
    return this.createPreference(ticketData);
  }

  async getPayment(paymentId: string) {
    const payment = new Payment(this.client);
    return await payment.get({ id: paymentId });
  }

  async refundPayment(paymentId: string) {
    const payment = new Payment(this.client);
    return await payment.cancel({ id: paymentId });
  }
}
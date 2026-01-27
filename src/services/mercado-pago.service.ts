import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as mercadopago from 'mercadopago';

@Injectable()
export class MercadoPagoService {
  private mercadopago: any;

  constructor(private configService: ConfigService) {
    this.mercadopago = mercadopago;
    this.mercadopago.configure({
      access_token: this.configService.get('MERCADO_PAGO_ACCESS_TOKEN'),
    });
  }

  async createPaymentPreference(
    ticketData: {
      id: string;
      bookingReference: string;
      totalPrice: number;
      currency: string;
      quantity: number;
      eventTitle: string;
      customerEmail: string;
    }
  ) {
    try {
      const preference = {
        items: [
          {
            id: ticketData.id,
            title: `Tickets for ${ticketData.eventTitle}`,
            description: `Booking Reference: ${ticketData.bookingReference}`,
            quantity: ticketData.quantity,
            unit_price: ticketData.totalPrice / ticketData.quantity,
            currency_id: ticketData.currency,
          },
        ],
        payer: {
          email: ticketData.customerEmail,
        },
        back_urls: {
          success: `${this.configService.get('FRONTEND_URL')}/payment/success`,
          failure: `${this.configService.get('FRONTEND_URL')}/payment/failure`,
          pending: `${this.configService.get('FRONTEND_URL')}/payment/pending`,
        },
        auto_return: 'approved',
        external_reference: ticketData.bookingReference,
        notification_url: `${this.configService.get('BACKEND_URL')}/mercadopago/webhook`,
      };

      const response = await this.mercadopago.preferences.create(preference);
      return {
        preferenceId: response.body.id,
        initPoint: response.body.init_point,
        sandboxInitPoint: response.body.sandbox_init_point,
      };
    } catch (error) {
      throw new Error(`Failed to create MercadoPago preference: ${error.message}`);
    }
  }

  async getPayment(paymentId: string) {
    try {
      const response = await this.mercadopago.payment.findById(paymentId);
      return response.body;
    } catch (error) {
      throw new Error(`Failed to get payment: ${error.message}`);
    }
  }

  async refundPayment(paymentId: string) {
    try {
      const response = await this.mercadopago.payment.refund(paymentId);
      return response.body;
    } catch (error) {
      throw new Error(`Failed to refund payment: ${error.message}`);
    }
  }
}

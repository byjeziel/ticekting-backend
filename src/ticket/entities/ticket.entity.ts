import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TicketDocument = Ticket & Document;

@Schema()
export class Ticket {
  @Prop({ type: Types.ObjectId, ref: 'Event', required: true })
  event: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  customer: Types.ObjectId;

  @Prop({ required: true })
  eventDate: Date;

  @Prop({ required: true })
  eventTime: string;

  @Prop({ required: true, default: 1 })
  quantity: number;

  @Prop({ required: true })
  totalPrice: number;

  @Prop({ required: true })
  currency: string;

  @Prop({ required: true, unique: true })
  bookingReference: string;

  @Prop({ required: true, default: 'pending' })
  status: 'pending' | 'confirmed' | 'cancelled' | 'used';

  @Prop({ required: true, default: 'pending' })
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';

  @Prop({ required: false })
  mercadoPagoPaymentId?: string;

  @Prop({ required: false })
  mercadoPagoPreferenceId?: string;

  @Prop({ required: true })
  qrCode: string;

  @Prop({ required: true })
  qrCodeSecret: string;

  @Prop({ required: true })
  customerEmail: string;

  @Prop({ required: true, default: false })
  emailVerified: boolean;

  @Prop({ required: false })
  emailVerificationToken?: string;

  @Prop({ required: false })
  validatedAt?: Date;

  @Prop({ required: false })
  validatedBy?: Types.ObjectId;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const TicketSchema = SchemaFactory.createForClass(Ticket);

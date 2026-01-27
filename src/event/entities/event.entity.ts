import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type EventDocument = Event & Document;

@Schema()
export class Event {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  richDescription: string;

  @Prop({ required: true })
  category: string;

  @Prop({ required: true })
  venue: string;

  @Prop({ required: true })
  address: string;

  @Prop({ required: true })
  city: string;

  @Prop({ required: true })
  country: string;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true })
  currency: string;

  @Prop({ default: 'https://via.placeholder.com/400x200?text=Event+Image' })
  imageUrl: string;

  @Prop([
    {
      date: { type: Date, required: true },
      time: { type: String, required: true },
      tickets: { type: Number, required: true },
      ticketsSold: { type: Number, default: 0 },
    },
  ])
  schedule: {
    date: Date;
    time: string;
    tickets: number;
    ticketsSold: number;
  }[];

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  producer: Types.ObjectId;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const EventSchema = SchemaFactory.createForClass(Event);

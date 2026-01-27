import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

export enum UserRole {
  ADMIN = 'admin',
  PRODUCER = 'producer',
  CLIENT = 'client',
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  auth0Id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true })
  email: string;

  @Prop()
  password?: string;

  @Prop()
  phone?: string;

  @Prop()
  organization?: string;

  @Prop({ type: String, enum: UserRole, default: UserRole.CLIENT })
  role: UserRole;

  @Prop({ default: true })
  isActive: boolean;

  // Relación con eventos (si es productor)
  @Prop({ type: [{ type: Types.ObjectId, ref: 'Event' }] })
  events?: Types.ObjectId[];

  // Relación con tickets (si es cliente)
  @Prop({ type: [{ type: Types.ObjectId, ref: 'Ticket' }] })
  tickets?: Types.ObjectId[];
}

export const UserSchema = SchemaFactory.createForClass(User);

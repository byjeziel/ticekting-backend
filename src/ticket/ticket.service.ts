import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Event, EventDocument } from '../event/entities/event.entity';
import { Ticket, TicketDocument } from './entities/ticket.entity';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { generateBookingReference } from '../utils/booking-reference.util';
import { QRCodeUtil } from '../utils/qr-code.util';
import { MercadoPagoService } from '../services/mercado-pago.service';
import { EmailService } from '../services/email.service';

@Injectable()
export class TicketService {
  constructor(
    @InjectModel(Event.name) private eventModel: Model<EventDocument>,
    @InjectModel(Ticket.name) private ticketModel: Model<TicketDocument>,
    private mercadoPagoService: MercadoPagoService,
    private emailService: EmailService,
  ) {}

  async create(createTicketDto: CreateTicketDto, customerId: string): Promise<any> {
    const event = await this.eventModel.findById(createTicketDto.eventId);
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const scheduleItem = event.schedule.find(item => 
      item.date.toISOString().split('T')[0] === createTicketDto.eventDate &&
      item.time === createTicketDto.eventTime
    );

    if (!scheduleItem) {
      throw new NotFoundException('Event schedule not found');
    }

    if (scheduleItem.ticketsSold + createTicketDto.quantity > scheduleItem.tickets) {
      throw new ConflictException('Not enough tickets available');
    }

    const totalPrice = event.price * createTicketDto.quantity;
    const bookingReference = generateBookingReference();

    // Generate QR code
    const emailVerificationToken = QRCodeUtil.generateEmailVerificationToken();
    const { qrCode, secret } = await QRCodeUtil.generateQRCode({
      ticketId: '', // Will be set after saving
      bookingReference,
      eventTitle: event.title,
      eventDate: createTicketDto.eventDate,
      eventTime: createTicketDto.eventTime,
      quantity: createTicketDto.quantity,
      customerEmail: createTicketDto.customerEmail,
      secret,
    });

    const ticket = new this.ticketModel({
      event: createTicketDto.eventId,
      customer: customerId,
      eventDate: new Date(createTicketDto.eventDate),
      eventTime: createTicketDto.eventTime,
      quantity: createTicketDto.quantity,
      totalPrice,
      currency: createTicketDto.currency,
      bookingReference,
      status: 'pending',
      paymentStatus: 'pending',
      qrCode,
      qrCodeSecret: secret,
      customerEmail: createTicketDto.customerEmail,
      emailVerified: false,
      emailVerificationToken,
    });

    const savedTicket = await ticket.save();

    // Update QR code with ticket ID
    const updatedQRData = {
      ticketId: (savedTicket as any)._id.toString(),
      bookingReference,
      eventTitle: event.title,
      eventDate: createTicketDto.eventDate,
      eventTime: createTicketDto.eventTime,
      quantity: createTicketDto.quantity,
      customerEmail: createTicketDto.customerEmail,
      secret,
    };

    const updatedQR = await QRCodeUtil.generateQRCode(updatedQRData);
    await this.ticketModel.updateOne(
      { _id: savedTicket._id },
      { qrCode: updatedQR.qrCode }
    );

    // Create MercadoPago preference
    const paymentPreference = await this.mercadoPagoService.createPaymentPreference({
      id: (savedTicket as any)._id.toString(),
      bookingReference,
      totalPrice,
      currency: createTicketDto.currency,
      quantity: createTicketDto.quantity,
      eventTitle: event.title,
      customerEmail: createTicketDto.customerEmail,
    });

    // Update ticket with MercadoPago preference ID
    await this.ticketModel.updateOne(
      { _id: savedTicket._id },
      { mercadoPagoPreferenceId: paymentPreference.preferenceId }
    );

    return {
      ticket: savedTicket,
      paymentPreference,
    };
  }

  async findByCustomer(customerId: string): Promise<Ticket[]> {
    return this.ticketModel
      .find({ customer: customerId })
      .populate('event')
      .exec();
  }

  async findByBookingReference(bookingReference: string): Promise<Ticket | null> {
    return this.ticketModel
      .findOne({ bookingReference })
      .populate('event')
      .exec();
  }

  async cancelTicket(ticketId: string, customerId: string): Promise<Ticket> {
    const ticket = await this.ticketModel.findOne({ _id: ticketId, customer: customerId });
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    if (ticket.status === 'cancelled') {
      throw new ConflictException('Ticket already cancelled');
    }

    if (ticket.paymentStatus === 'paid') {
      // Refund through MercadoPago
      if (ticket.mercadoPagoPaymentId) {
        await this.mercadoPagoService.refundPayment(ticket.mercadoPagoPaymentId);
      }
    }

    ticket.status = 'cancelled';
    await ticket.save();

    await this.eventModel.updateOne(
      { 
        _id: ticket.event,
        'schedule.date': ticket.eventDate,
        'schedule.time': ticket.eventTime
      },
      { 
        $inc: { 'schedule.$.ticketsSold': -ticket.quantity }
      }
    );

    return ticket;
  }

  async processPayment(paymentId: string, status: string): Promise<void> {
    const ticket = await this.ticketModel.findOne({ mercadoPagoPaymentId: paymentId });
    if (!ticket) {
      throw new NotFoundException('Ticket not found for payment');
    }

    if (status === 'approved') {
      ticket.paymentStatus = 'paid';
      ticket.status = 'confirmed';
      
      // Update ticket inventory
      await this.eventModel.updateOne(
        { 
          _id: ticket.event,
          'schedule.date': ticket.eventDate,
          'schedule.time': ticket.eventTime
        },
        { 
          $inc: { 'schedule.$.ticketsSold': ticket.quantity }
        }
      );

      // Send ticket email
      const event = await this.eventModel.findById(ticket.event);
      if (event) {
        await this.emailService.sendTicketEmail(ticket.customerEmail, {
          bookingReference: ticket.bookingReference,
          eventTitle: event.title,
          eventDate: ticket.eventDate.toISOString(),
          eventTime: ticket.eventTime,
          quantity: ticket.quantity,
          totalPrice: ticket.totalPrice,
          currency: ticket.currency,
          qrCode: ticket.qrCode || '',
          emailVerificationToken: ticket.emailVerificationToken || '',
        });
      }
    } else if (status === 'rejected') {
      ticket.paymentStatus = 'failed';
      ticket.status = 'cancelled';
    }

    await ticket.save();
  }

  async verifyEmail(token: string): Promise<{ success: boolean; message: string }> {
    const ticket = await this.ticketModel.findOne({ emailVerificationToken: token });
    if (!ticket) {
      return { success: false, message: 'Invalid verification token' };
    }

    if (ticket.emailVerified) {
      return { success: true, message: 'Email already verified' };
    }

    ticket.emailVerified = true;
    ticket.emailVerificationToken = undefined;
    await ticket.save();

    return { success: true, message: 'Email verified successfully' };
  }

  async validateTicket(qrDataString: string, staffId: string): Promise<{ valid: boolean; ticket?: any; message: string }> {
    const qrData = await QRCodeUtil.verifyQRCode(qrDataString);
    if (!qrData) {
      return { valid: false, message: 'Invalid QR code' };
    }

    const ticket = await this.ticketModel.findById(qrData.ticketId).populate('event');
    if (!ticket) {
      return { valid: false, message: 'Ticket not found' };
    }

    if (ticket.status !== 'confirmed') {
      return { valid: false, message: 'Ticket not confirmed or already used' };
    }

    if (ticket.status === 'used') {
      return { valid: false, message: 'Ticket already used' };
    }

    if (!ticket.emailVerified) {
      return { valid: false, message: 'Ticket email not verified' };
    }

    // Mark ticket as used
    ticket.status = 'used';
    ticket.validatedAt = new Date();
    ticket.validatedBy = new Types.ObjectId(staffId);
    await ticket.save();

    return { 
      valid: true, 
      ticket: {
        bookingReference: ticket.bookingReference,
        eventTitle: (ticket.event as any).title,
        customerEmail: ticket.customerEmail,
        quantity: ticket.quantity,
        validatedAt: ticket.validatedAt,
      },
      message: 'Ticket validated successfully' 
    };
  }
}

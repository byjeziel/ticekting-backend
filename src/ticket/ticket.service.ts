import { Injectable, ConflictException, NotFoundException, ForbiddenException, UnauthorizedException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Event, EventDocument } from '../event/entities/event.entity';
import { Ticket, TicketDocument } from './entities/ticket.entity';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { generateBookingReference } from '../utils/booking-reference.util';
import { QRCodeUtil } from '../utils/qr-code.util';
import { MercadopagoService } from '../services/mercado-pago.service';
import { EmailService } from '../services/email.service';
import { UserService } from '../user/user.service';

@Injectable()
export class TicketService {
  private readonly logger = new Logger(TicketService.name);

  constructor(
    @InjectModel(Event.name) private eventModel: Model<EventDocument>,
    @InjectModel(Ticket.name) private ticketModel: Model<TicketDocument>,
    private mercadoPagoService: MercadopagoService,
    private emailService: EmailService,
    private userService: UserService,
  ) {}

  async create(createTicketDto: CreateTicketDto, customerId: string): Promise<any> {
    if (!customerId) {
      throw new UnauthorizedException('User not found in database. Please refresh and try again.');
    }

    const event = await this.eventModel.findById(createTicketDto.eventId);
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const scheduleItem = event.schedule.find(item =>
      item.date.toISOString().split('T')[0] === createTicketDto.eventDate.split('T')[0] &&
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
      secret: '', // Placeholder - will be generated inside the method
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
    let paymentPreference: any;
    try {
      paymentPreference = await this.mercadoPagoService.createPaymentPreference({
        id: (savedTicket as any)._id.toString(),
        bookingReference,
        totalPrice,
        currency: createTicketDto.currency,
        quantity: createTicketDto.quantity,
        eventTitle: event.title,
        customerEmail: createTicketDto.customerEmail,
      });
    } catch (mpError: any) {
      this.logger.error('MercadoPago preference creation failed', mpError?.message || mpError);
      this.logger.error('MP error details:', JSON.stringify(mpError?.cause ?? mpError));
      throw mpError;
    }

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

  async devConfirmPending(customerId: string): Promise<{ confirmed: number }> {
    const pending = await this.ticketModel.find({ customer: customerId, paymentStatus: 'pending' });
    for (const ticket of pending) {
      ticket.status = 'confirmed';
      ticket.paymentStatus = 'paid';
      ticket.emailVerified = true;
      await ticket.save();
    }
    return { confirmed: pending.length };
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

  async handleMercadoPagoPayment(paymentId: string): Promise<void> {
    const payment = await this.mercadoPagoService.getPayment(paymentId);
    if (!payment.external_reference || !payment.status) return;

    const ticket = await this.ticketModel.findOne({ bookingReference: payment.external_reference });
    if (!ticket) return;

    // Idempotency: skip if already processed
    if (ticket.paymentStatus === 'paid') return;

    ticket.mercadoPagoPaymentId = paymentId;

    if (payment.status === 'approved') {
      ticket.paymentStatus = 'paid';
      ticket.status = 'confirmed';

      await this.eventModel.updateOne(
        {
          _id: ticket.event,
          'schedule.date': ticket.eventDate,
          'schedule.time': ticket.eventTime,
        },
        { $inc: { 'schedule.$.ticketsSold': ticket.quantity } },
      );

      try {
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
      } catch {
        // Email failure should not block payment confirmation
      }
    } else if (payment.status === 'rejected') {
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

  async transferTicket(
    ticketId: string,
    requesterId: string,
    recipientEmail: string,
  ): Promise<{ success: boolean; message: string }> {
    const ticket = await this.ticketModel.findById(ticketId).populate('event');
    if (!ticket) throw new NotFoundException('Ticket not found');

    if (ticket.customer.toString() !== requesterId)
      throw new ForbiddenException('You are not the owner of this ticket');

    if (ticket.status !== 'confirmed')
      throw new ConflictException('Only confirmed tickets can be transferred');

    if (recipientEmail === ticket.customerEmail)
      throw new ConflictException('You cannot transfer a ticket to yourself');

    const recipient = await this.userService.findByEmail(recipientEmail);
    if (!recipient)
      throw new NotFoundException('Recipient not found. They must be registered in the app.');

    const event = ticket.event as any;
    const { qrCode, secret } = await QRCodeUtil.generateQRCode({
      ticketId: (ticket as any)._id.toString(),
      bookingReference: ticket.bookingReference,
      eventTitle: event.title,
      eventDate: ticket.eventDate.toISOString(),
      eventTime: ticket.eventTime,
      quantity: ticket.quantity,
      customerEmail: recipientEmail,
      secret: '',
    });

    const verificationToken = QRCodeUtil.generateEmailVerificationToken();
    ticket.customer = (recipient as any)._id as Types.ObjectId;
    ticket.customerEmail = recipientEmail;
    ticket.qrCode = qrCode;
    ticket.qrCodeSecret = secret;
    ticket.emailVerified = false;
    ticket.emailVerificationToken = verificationToken;
    await ticket.save();

    try {
      await this.emailService.sendTicketEmail(recipientEmail, {
        bookingReference: ticket.bookingReference,
        eventTitle: event.title,
        eventDate: ticket.eventDate.toISOString(),
        eventTime: ticket.eventTime,
        quantity: ticket.quantity,
        totalPrice: ticket.totalPrice,
        currency: ticket.currency,
        qrCode,
        emailVerificationToken: verificationToken,
      });
    } catch {
      // Email failure should not block transfer
    }

    return { success: true, message: 'Ticket transferred successfully' };
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

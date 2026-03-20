import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Event, EventDocument } from '../../event/entities/event.entity';
import { Ticket, TicketDocument } from '../../ticket/entities/ticket.entity';
import { User, UserDocument, UserRole } from '../../producers/entities/user.entity';
import { QRCodeUtil } from '../../utils/qr-code.util';
import { EmailService } from '../../services/email.service';
import { generateBookingReference } from '../../utils/booking-reference.util';

@Injectable()
export class EventSeedService {
  constructor(
    @InjectModel(Event.name) private eventModel: Model<EventDocument>,
    @InjectModel(Ticket.name) private ticketModel: Model<TicketDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private emailService: EmailService,
  ) {}

  async seedEvents() {
    // Clear existing events
    await this.eventModel.deleteMany({});

    // Sample producer ID (you might want to create a real producer user first)
    const producerId = new Types.ObjectId();

    const sampleEvents = [
      {
        title: 'Rock Festival 2024',
        description: 'Annual rock festival featuring top international bands',
        richDescription: '<p>Experience the best rock music of the year!</p>',
        category: 'Music',
        venue: 'Estadio Monumental',
        address: 'Av. Presidente Figueroa Alcorta 7599',
        city: 'Buenos Aires',
        country: 'Argentina',
        price: 150000,
        currency: 'ARS',
        imageUrl: 'https://placehold.co/400x200/1e3a5f/ffffff?text=Rock+Festival',
        schedule: [
          {
            date: new Date('2024-12-15'),
            time: '20:00',
            tickets: 5000,
            ticketsSold: 1200,
          },
          {
            date: new Date('2024-12-16'),
            time: '20:00',
            tickets: 5000,
            ticketsSold: 800,
          },
        ],
        producer: producerId,
        isActive: true,
      },
      {
        title: 'Stand-up Comedy Night',
        description: 'An evening of laughter with top comedians',
        richDescription: '<p>Join us for a night full of laughs!</p>',
        category: 'Comedy',
        venue: 'Teatro Gran Rex',
        address: 'Av. Corrientes 857',
        city: 'Buenos Aires',
        country: 'Argentina',
        price: 45000,
        currency: 'ARS',
        imageUrl: 'https://placehold.co/400x200/5f1e3a/ffffff?text=Comedy+Night',
        schedule: [
          {
            date: new Date('2024-11-22'),
            time: '21:00',
            tickets: 800,
            ticketsSold: 350,
          },
          {
            date: new Date('2024-11-23'),
            time: '21:00',
            tickets: 800,
            ticketsSold: 200,
          },
        ],
        producer: producerId,
        isActive: true,
      },
      {
        title: 'Tech Conference 2024',
        description: 'Latest trends in technology and innovation',
        richDescription: '<p>Learn about the future of technology!</p>',
        category: 'Technology',
        venue: 'Centro de Convenciones',
        address: 'Av. del Libertador 749',
        city: 'Buenos Aires',
        country: 'Argentina',
        price: 120000,
        currency: 'ARS',
        imageUrl: 'https://placehold.co/400x200/1e5f3a/ffffff?text=Tech+Conference',
        schedule: [
          {
            date: new Date('2024-12-01'),
            time: '09:00',
            tickets: 300,
            ticketsSold: 150,
          },
          {
            date: new Date('2024-12-02'),
            time: '09:00',
            tickets: 300,
            ticketsSold: 100,
          },
        ],
        producer: producerId,
        isActive: true,
      },
      {
        title: 'Jazz Evening',
        description: 'Smooth jazz performances in an intimate setting',
        richDescription: '<p>Enjoy an evening of sophisticated jazz music!</p>',
        category: 'Music',
        venue: 'Café Vinilo',
        address: 'Gorriti 3780',
        city: 'Buenos Aires',
        country: 'Argentina',
        price: 35000,
        currency: 'ARS',
        imageUrl: 'https://placehold.co/400x200/3a1e5f/ffffff?text=Jazz+Evening',
        schedule: [
          {
            date: new Date('2024-11-30'),
            time: '20:30',
            tickets: 150,
            ticketsSold: 45,
          },
        ],
        producer: producerId,
        isActive: true,
      },
      {
        title: 'Food & Wine Festival',
        description: 'Taste the best local cuisine and wines',
        richDescription: '<p>A culinary journey through Argentine flavors!</p>',
        category: 'Food',
        venue: 'La Rural',
        address: 'Av. Sarmiento 2704',
        city: 'Buenos Aires',
        country: 'Argentina',
        price: 85000,
        currency: 'ARS',
        imageUrl: 'https://placehold.co/400x200/5f3a1e/ffffff?text=Food+Wine',
        schedule: [
          {
            date: new Date('2024-12-08'),
            time: '12:00',
            tickets: 2000,
            ticketsSold: 750,
          },
          {
            date: new Date('2024-12-09'),
            time: '12:00',
            tickets: 2000,
            ticketsSold: 600,
          },
        ],
        producer: producerId,
        isActive: true,
      },
      {
        title: 'Evento de Prueba Real',
        description: 'Evento de prueba para validar el flujo de pago real con MercadoPago',
        richDescription: '<p>Evento de prueba. Precio mínimo para validar integración de pagos.</p>',
        category: 'Test',
        venue: 'Venue de Prueba',
        address: 'Dirección de Prueba 123',
        city: 'Buenos Aires',
        country: 'Argentina',
        price: 0.01,
        currency: 'ARS',
        imageUrl: 'https://placehold.co/400x200/1a1a2e/ffffff?text=Prueba+Real',
        schedule: [
          {
            date: new Date('2026-06-20'),
            time: '18:00',
            tickets: 200,
            ticketsSold: 0,
          },
        ],
        producer: producerId,
        isActive: true,
      },
      {
        title: 'Noche de Teatro',
        description: 'Una noche de teatro de alto nivel con actores de renombre nacional',
        richDescription: '<p>Una experiencia teatral única con las mejores obras del año.</p>',
        category: 'Theater',
        venue: 'Teatro Colón',
        address: 'Cerrito 628',
        city: 'Buenos Aires',
        country: 'Argentina',
        price: 75000,
        currency: 'ARS',
        imageUrl: 'https://placehold.co/400x200/2d1e5f/ffffff?text=Noche+de+Teatro',
        schedule: [
          {
            date: new Date('2026-06-20'),
            time: '20:00',
            tickets: 200,
            ticketsSold: 0,
          },
        ],
        producer: producerId,
        isActive: true,
      },
    ];

    const createdEvents = await this.eventModel.insertMany(sampleEvents);
    console.log(`Created ${createdEvents.length} sample events`);

    // Seed confirmed tickets for the specific user
    await this.ticketModel.deleteMany({});
    const user = await this.userModel.findOne({ email: 'leandropaladino15@gmail.com' });
    if (!user) {
      console.log('User leandropaladino15@gmail.com not found — skipping ticket seed. Log in once and re-run the seed.');
      return createdEvents;
    }

    const ticketSeeds = [
      { event: createdEvents[0], quantity: 2, scheduleIdx: 0 },
      { event: createdEvents[5], quantity: 1, scheduleIdx: 0 }, // Evento de Prueba Real
    ];

    for (const seed of ticketSeeds) {
      const schedule = (seed.event as any).schedule[seed.scheduleIdx];
      const bookingReference = generateBookingReference();
      const totalPrice = (seed.event as any).price * seed.quantity;
      const emailVerificationToken = QRCodeUtil.generateEmailVerificationToken();

      const { qrCode, secret } = await QRCodeUtil.generateQRCode({
        ticketId: '',
        bookingReference,
        eventTitle: (seed.event as any).title,
        eventDate: schedule.date.toISOString(),
        eventTime: schedule.time,
        quantity: seed.quantity,
        customerEmail: (user as any).email,
        secret: '',
      });

      const ticket = new this.ticketModel({
        event: (seed.event as any)._id,
        customer: (user as any)._id,
        eventDate: schedule.date,
        eventTime: schedule.time,
        quantity: seed.quantity,
        totalPrice,
        currency: (seed.event as any).currency,
        bookingReference,
        status: 'confirmed',
        paymentStatus: 'paid',
        qrCode,
        qrCodeSecret: secret,
        customerEmail: (user as any).email,
        emailVerified: true,
        emailVerificationToken,
      });

      const saved = await ticket.save();

      // Regenerate QR with real ticket ID
      const updatedQR = await QRCodeUtil.generateQRCode({
        ticketId: (saved as any)._id.toString(),
        bookingReference,
        eventTitle: (seed.event as any).title,
        eventDate: schedule.date.toISOString(),
        eventTime: schedule.time,
        quantity: seed.quantity,
        customerEmail: (user as any).email,
        secret,
      });
      await this.ticketModel.updateOne({ _id: saved._id }, { qrCode: updatedQR.qrCode });

      // Send confirmation email
      try {
        await this.emailService.sendTicketEmail((user as any).email, {
          bookingReference,
          eventTitle: (seed.event as any).title,
          eventDate: schedule.date.toISOString(),
          eventTime: schedule.time,
          quantity: seed.quantity,
          totalPrice,
          currency: (seed.event as any).currency,
          qrCode: updatedQR.qrCode,
          emailVerificationToken,
        });
      } catch {
        console.log(`Email for ${bookingReference} failed (non-critical)`);
      }

      console.log(`Created confirmed ticket ${bookingReference} for ${(user as any).email}`);
    }

    // Set roles for specific users
    const roleAssignments = [
      { email: 'jezielpaladino@gmail.com', role: UserRole.ADMIN },
      { email: 'paladinojeziel@gmail.com', role: UserRole.PRODUCER },
    ];

    for (const assignment of roleAssignments) {
      const result = await this.userModel.updateOne(
        { email: assignment.email },
        { role: assignment.role },
      );
      if (result.matchedCount === 0) {
        console.log(`User ${assignment.email} not found — log in once and re-run the seed.`);
      } else {
        console.log(`Set role '${assignment.role}' for ${assignment.email}`);
      }
    }

    return createdEvents;
  }
}

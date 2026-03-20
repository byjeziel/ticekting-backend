import { Module } from '@nestjs/common';
import { TicketService } from './ticket.service';
import { TicketController } from './ticket.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Ticket, TicketSchema } from './entities/ticket.entity';
import { Event, EventSchema } from '../event/entities/event.entity';
import { MercadopagoService } from '../services/mercado-pago.service';
import { EmailService } from '../services/email.service';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Ticket.name, schema: TicketSchema },
      { name: Event.name, schema: EventSchema },
    ]),
    UserModule,
  ],
  controllers: [TicketController],
  providers: [TicketService, MercadopagoService, EmailService],
})
export class TicketModule {}

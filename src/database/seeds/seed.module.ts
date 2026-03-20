import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventSeedService } from './event.seed';
import { Event, EventSchema } from '../../event/entities/event.entity';
import { Ticket, TicketSchema } from '../../ticket/entities/ticket.entity';
import { User, UserSchema } from '../../producers/entities/user.entity';
import { EmailService } from '../../services/email.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Event.name, schema: EventSchema },
      { name: Ticket.name, schema: TicketSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  providers: [EventSeedService, EmailService],
  exports: [EventSeedService],
})
export class SeedModule {}

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Event, EventSchema } from './entities/event.entity';
import { EventService } from './event.service';
import { EventController } from './event.controller';
import { User, UserSchema } from 'src/producers/entities/user.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Event.name, schema: EventSchema, },
      {name: User.name, schema: UserSchema }]),
  ],
  controllers: [EventController],
  providers: [EventService],
})
export class EventModule {}

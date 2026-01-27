import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Event, EventDocument } from './entities/event.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { User, UserDocument, UserRole } from '../producers/entities/user.entity';

@Injectable()
export class EventService {
  constructor(
    @InjectModel(Event.name) private eventModel: Model<EventDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async create(createEventDto: CreateEventDto, auth0Id: string): Promise<Event> {
    const user = await this.userModel.findOne({ auth0Id });
    if (!user) {
      throw new ForbiddenException('User not found');
    }

    const createdEvent = new this.eventModel({
      ...createEventDto,
      producer: user._id,
    });
    return createdEvent.save();
  }

  async findAll(): Promise<Event[]> {
    return this.eventModel.find({ isActive: true }).exec();
  }

  async findOne(id: string): Promise<Event | null> {
    return this.eventModel.findById(id).exec();
  }

  async update(id: string, updateEventDto: UpdateEventDto, auth0Id: string): Promise<Event | null> {
    const user = await this.userModel.findOne({ auth0Id });
    if (!user) {
      throw new ForbiddenException('User not found');
    }

    const event = await this.eventModel.findById(id);
    if (!event) {
      return null;
    }

    // Check if user owns the event or is admin
    if (user.role !== UserRole.ADMIN && event.producer.toString() !== (user._id as any).toString()) {
      throw new ForbiddenException('You can only update your own events');
    }

    return this.eventModel.findByIdAndUpdate(id, updateEventDto, { new: true }).exec();
  }

  async remove(id: string, auth0Id: string): Promise<Event | null> {
    const user = await this.userModel.findOne({ auth0Id });
    if (!user) {
      throw new ForbiddenException('User not found');
    }

    const event = await this.eventModel.findById(id);
    if (!event) {
      return null;
    }

    // Check if user owns the event or is admin
    if (user.role !== UserRole.ADMIN && event.producer.toString() !== (user._id as any).toString()) {
      throw new ForbiddenException('You can only delete your own events');
    }

    return this.eventModel.findByIdAndDelete(id).exec();
  }
}

import {Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request} from '@nestjs/common';
import { EventService } from './event.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../producers/entities/user.entity';

@Controller('events')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PRODUCER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new event (Producer/Admin only)' })
  @ApiResponse({ status: 201, description: 'Event Created.' })
  @ApiBody({ type: CreateEventDto })
  create(@Body() createEventDto: CreateEventDto, @Request() req) {
    return this.eventService.create(createEventDto, req.user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'Get events' })
  @ApiResponse({ status: 200, description: 'List of events.' })
  findAll() {
    return this.eventService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find event' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiResponse({ status: 200, description: 'Event found.' })
  findOne(@Param('id') id: string) {
    return this.eventService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PRODUCER, UserRole.ADMIN)
  @Patch(':id')
  @ApiOperation({ summary: 'Update event (Producer/Admin only)' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiBody({ type: UpdateEventDto })
  @ApiResponse({ status: 200, description: 'Event updated.' })
  update(@Param('id') id: string, @Body() updateEventDto: UpdateEventDto, @Request() req) {
    return this.eventService.update(id, updateEventDto, req.user.sub);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PRODUCER, UserRole.ADMIN)
  @Delete(':id')
  @ApiOperation({ summary: 'Remove event (Producer/Admin only)' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiResponse({ status: 200, description: 'Event deleted.' })
  remove(@Param('id') id: string, @Request() req) {
    return this.eventService.remove(id, req.user.sub);
  }
}

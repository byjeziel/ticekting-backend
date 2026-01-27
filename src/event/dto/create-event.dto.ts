import { IsString, IsArray, ValidateNested, IsInt, IsDateString, IsNumber, IsOptional, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ScheduleItemDto {
  @ApiProperty({ example: '2025-10-01', description: 'Event date (YYYY-MM-DD)' })
  @IsDateString()
  date: string;

  @ApiProperty({ example: '18:00', description: 'Event time (HH:mm)' })
  @IsString()
  time: string;

  @ApiProperty({ example: 100, description: 'Number of tickets for this date' })
  @IsInt()
  tickets: number;
}

export class CreateEventDto {
  @ApiProperty({ example: 'Creamfields', description: 'Event title' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Electronic music event', description: 'Event description' })
  @IsString()
  description: string;

  @ApiProperty({ example: '<p>Join us for an <strong>unforgettable</strong> electronic music experience...</p>', description: 'Rich text description of the event' })
  @IsString()
  richDescription: string;

  @ApiProperty({ example: 'Music Festival', description: 'Event category' })
  @IsString()
  category: string;

  @ApiProperty({ example: 'Buenos Aires Convention Center', description: 'Event venue' })
  @IsString()
  venue: string;

  @ApiProperty({ example: 'Av. Corrientes 1234', description: 'Event address' })
  @IsString()
  address: string;

  @ApiProperty({ example: 'Buenos Aires', description: 'Event city' })
  @IsString()
  city: string;

  @ApiProperty({ example: 'Argentina', description: 'Event country' })
  @IsString()
  country: string;

  @ApiProperty({ example: 50.00, description: 'Ticket price' })
  @IsNumber()
  price: number;

  @ApiProperty({ example: 'USD', description: 'Currency code' })
  @IsString()
  currency: string;

  @ApiProperty({ example: 'https://example.com/event-image.jpg', description: 'Event image URL', required: false })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({ type: [ScheduleItemDto], description: 'Event dates, times, and tickets' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScheduleItemDto)
  schedule: ScheduleItemDto[];

  @ApiProperty({ example: '6527e2b2f1c2b2a1e8d7c9f0', description: 'ID del productor asociado' })
  @IsString()
  producer: string;
}
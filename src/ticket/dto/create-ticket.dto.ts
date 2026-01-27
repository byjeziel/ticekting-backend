import { IsString, IsNumber, IsDateString, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTicketDto {
  @ApiProperty({ example: '6527e2b2f1c2b2a1e8d7c9f0', description: 'Event ID' })
  @IsString()
  eventId: string;

  @ApiProperty({ example: '2025-10-01', description: 'Event date (YYYY-MM-DD)' })
  @IsDateString()
  eventDate: string;

  @ApiProperty({ example: '18:00', description: 'Event time (HH:mm)' })
  @IsString()
  eventTime: string;

  @ApiProperty({ example: 2, description: 'Number of tickets' })
  @IsNumber()
  quantity: number;

  @ApiProperty({ example: 'USD', description: 'Currency code' })
  @IsString()
  currency: string;

  @ApiProperty({ example: 'customer@example.com', description: 'Customer email for ticket delivery' })
  @IsEmail()
  customerEmail: string;
}

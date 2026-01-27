import { ApiProperty } from '@nestjs/swagger';
import { CreateEventDto } from './create-event.dto';

export class FindOneEventDto extends CreateEventDto {
  @ApiProperty({ example: '6527e2b2f1c2b2a1e8d7c9f0', description: 'Event ID' })
  _id: string;
}
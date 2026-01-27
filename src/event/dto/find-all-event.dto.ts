import { ApiProperty } from '@nestjs/swagger';
import { CreateEventDto } from './create-event.dto';

export class FindAllEventDto {
  @ApiProperty({ type: [CreateEventDto] })
  events: CreateEventDto[];
}
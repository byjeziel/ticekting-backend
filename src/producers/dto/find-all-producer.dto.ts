import { ApiProperty } from '@nestjs/swagger';
import { CreateProducerDto } from './create-producer.dto';

export class FindAllProducerDto {
  @ApiProperty({ type: [CreateProducerDto] })
  producers: CreateProducerDto[];
}
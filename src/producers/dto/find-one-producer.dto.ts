import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../entities/user.entity';

export class FindOneProducerDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ enum: UserRole })
  role: UserRole;

  @ApiProperty({ type: [String], description: 'Events asociated IDs' })
  events?: string[];
}
import { ApiProperty } from '@nestjs/swagger';

export class RemoveProducerDto {
  @ApiProperty({ example: '6527e2b2f1c2b2a1e8d7c9f0', description: 'Producer ID' })
  id: string;

  @ApiProperty({ example: true, description: 'Producer removed' })
  deleted: boolean;
}
import { ApiProperty } from '@nestjs/swagger';

export class RemoveEventDto {
  @ApiProperty({ example: '6527e2b2f1c2b2a1e8d7c9f0', description: 'Deleted event ID' })
  id: string;

  @ApiProperty({ example: true, description: 'Indicates if the event was successfully deleted' })
  deleted: boolean;
}
import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsOptional, IsString } from "class-validator";
import { UserRole } from "../entities/user.entity";

export class CreateProducerDto {
  @ApiProperty({ example: 'Producer Name' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'producer@mail.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', required: false })
  @IsString()
  password: string;

  @ApiProperty({ example: '+5491112345678', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'Producer Company', required: false })
  @IsOptional()
  @IsString()
  organization?: string;

  @ApiProperty({ example: UserRole.PRODUCER, enum: UserRole, default: UserRole.PRODUCER })
  readonly role: UserRole = UserRole.PRODUCER;
}
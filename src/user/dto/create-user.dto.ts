import { IsString, IsEnum, IsEmail, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum UserRole {
  ADMIN = 'admin',
  PRODUCER = 'producer',
  CLIENT = 'client',
}

export class CreateUserDto {
  @ApiProperty({ example: 'auth0|1234567890', description: 'Auth0 user ID' })
  @IsString()
  auth0Id: string;

  @ApiProperty({ example: 'user@example.com', description: 'User email' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'John Doe', description: 'User name' })
  @IsString()
  name: string;

  @ApiProperty({ enum: UserRole, description: 'User role' })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({ example: true, description: 'User active status', required: false })
  @IsOptional()
  isActive?: boolean;
}

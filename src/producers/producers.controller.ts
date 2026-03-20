import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ProducersService } from './producers.service';
import { CreateProducerDto } from './dto/create-producer.dto';
import { UpdateProducerDto } from './dto/update-producer.dto';
import { ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from './entities/user.entity';

@Controller('producers')
export class ProducersController {
  constructor(private readonly producersService: ProducersService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new producer' })
  @ApiResponse({ status: 201, description: 'Producer Created.' })
  @ApiBody({ type: CreateProducerDto })
  create(@Body() createProducerDto: CreateProducerDto) {
    return this.producersService.create(createProducerDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get producers' })
  @ApiResponse({ status: 200, description: 'List of producers.' })
  findAll() {
    return this.producersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find producer' })
  @ApiParam({ name: 'id', description: 'Producer ID' })
  @ApiResponse({ status: 200, description: 'Producer finded.' })
  findOne(@Param('id') id: string) {
    return this.producersService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update producer' })
  @ApiParam({ name: 'id', description: 'Producer ID' })
  @ApiBody({ type: UpdateProducerDto })
  @ApiResponse({ status: 200, description: 'Producer updated.' })
  update(@Param('id') id: string, @Body() updateProducerDto: UpdateProducerDto) {
    return this.producersService.update(id, updateProducerDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Remove producer' })
  @ApiParam({ name: 'id', description: 'Producer ID' })
  @ApiResponse({ status: 200, description: 'Producer deleted.' })
  remove(@Param('id') id: string) {
    return this.producersService.remove(id);
  }
}

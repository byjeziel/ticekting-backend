import { Controller, Get, Post, Patch, Body, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../producers/entities/user.entity';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('sync')
  @ApiOperation({ summary: 'Sync Auth0 user with DB (auto-create on first login)' })
  @ApiResponse({ status: 201, description: 'User synced successfully.' })
  sync(@Request() req, @Body() body: { email?: string; name?: string }) {
    return this.userService.createOrUpdateFromAuth0({
      sub: req.user.sub,
      email: body.email ?? req.user.email ?? req.user.sub,
      name: body.name ?? req.user.name ?? 'User',
    });
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new user (Admin only)' })
  @ApiResponse({ status: 201, description: 'User created successfully.' })
  @ApiBody({ type: CreateUserDto })
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of all users.' })
  findAll() {
    return this.userService.findAll();
  }

  @Get('producers')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all producers (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of all producers.' })
  findProducers() {
    return this.userService.findByRole(UserRole.PRODUCER);
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile.' })
  getProfile(@Request() req) {
    return this.userService.findByAuth0Id(req.user.sub);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get user by ID (Admin only)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User found.' })
  findOne(@Param('id') id: string) {
    return this.userService.findById(id);
  }

  @Patch(':id/role')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update user role (Admin only)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User role updated.' })
  updateRole(@Param('id') id: string, @Body() body: { role: UserRole }) {
    return this.userService.update(id, { role: body.role });
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Deactivate user (Admin only)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User deactivated.' })
  remove(@Param('id') id: string) {
    return this.userService.deactivate(id);
  }
}

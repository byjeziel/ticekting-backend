import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';
import { UserRole } from '../producers/entities/user.entity';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    
    if (!user || !user.sub) {
      return false;
    }

    // Get UserService from the module context
    const app = context.switchToHttp().getRequest().app;
    const userService = app.get('UserService');
    
    if (!userService) {
      console.error('UserService not found in application context');
      return false;
    }

    const userRecord = await userService.findByAuth0Id(user.sub);

    if (!userRecord) {
      return false;
    }

    return requiredRoles.some((role) => userRecord.role === role);
  }
}

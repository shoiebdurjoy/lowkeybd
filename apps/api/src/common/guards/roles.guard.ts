import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { PrismaService } from '../database/prisma.service';

interface JwtUser {
  userId: string;
  role?: string;
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: JwtUser }>();
    const user: JwtUser | undefined = request.user;

    if (!user) {
      throw new ForbiddenException('Access denied');
    }

    // If role is already in the JWT payload, use it
    let userRole: string | undefined = user.role;

    // Fall back to DB lookup if role is not in the token
    if (!userRole) {
      const dbUser = await this.prisma.user.findUnique({
        where: { id: user.userId },
        select: { role: true },
      });
      if (!dbUser) {
        throw new ForbiddenException('Access denied');
      }
      userRole = dbUser.role;
    }

    if (!userRole || !requiredRoles.includes(userRole)) {
      throw new ForbiddenException(
        'You do not have permission to access this resource',
      );
    }

    return true;
  }
}

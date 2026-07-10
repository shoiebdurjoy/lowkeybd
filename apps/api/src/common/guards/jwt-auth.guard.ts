import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const parentResult = super.canActivate(context);
    const result =
      typeof parentResult === 'boolean'
        ? parentResult
        : await (parentResult as Promise<boolean>);

    if (!result) {
      return false;
    }

    const request = context
      .switchToHttp()
      .getRequest<{ user?: { userId: string } }>();
    if (request.user) {
      const ban = await this.prisma.userRestriction.findFirst({
        where: {
          userId: request.user.userId,
          type: 'ban',
          isActive: true,
        },
      });
      if (ban) {
        throw new ForbiddenException(
          `Your account has been banned: ${ban.reason}`,
        );
      }
    }

    return true;
  }

  handleRequest<TUser = any>(err: any, user: TUser): TUser {
    if (err || !user) {
      throw err || new UnauthorizedException();
    }
    return user;
  }
}

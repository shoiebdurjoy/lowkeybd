import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

interface JwtUser {
  userId: string;
}

@Injectable()
export class PostRestrictionGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ user?: JwtUser }>();
    const user = request.user;
    if (!user) {
      return true; // Let auth guard block it if not logged in
    }

    const restriction = await this.prisma.userRestriction.findFirst({
      where: {
        userId: user.userId,
        type: 'post_restrict',
        isActive: true,
      },
    });

    if (restriction) {
      throw new ForbiddenException(
        `Your account has been restricted from creating posts: ${restriction.reason}`,
      );
    }

    return true;
  }
}

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
export class EmailVerifiedGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ user?: JwtUser }>();
    const user = request.user;
    if (!user) {
      throw new ForbiddenException('Access denied');
    }

    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.userId },
      select: { isVerified: true },
    });

    if (!dbUser || !dbUser.isVerified) {
      throw new ForbiddenException(
        'Please verify your email address to perform this action.',
      );
    }

    return true;
  }
}

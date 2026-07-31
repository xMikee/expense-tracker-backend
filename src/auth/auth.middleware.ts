import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly prisma: PrismaService) {}

  async use(req: any, res: any, next: () => void) {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) {
      throw new UnauthorizedException('Header x-api-key mancante');
    }

    const user = await this.prisma.user.findUnique({ where: { apiKey } });
    if (!user) {
      throw new UnauthorizedException('API key non valida');
    }

    req.userId = user.id;
    next();
  }
}

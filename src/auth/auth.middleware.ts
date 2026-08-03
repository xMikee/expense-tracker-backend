import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async use(req: any, res: any, next: () => void) {
    const authHeader = req.headers['authorization'];

    if (authHeader?.toLowerCase().startsWith('bearer ')) {
      const token = authHeader.slice('Bearer '.length);
      try {
        const payload = await this.jwt.verifyAsync(token);
        req.userId = payload.sub;
        return next();
      } catch {
        throw new UnauthorizedException('Token non valido o scaduto');
      }
    }

    const apiKey = req.headers['x-api-key'];
    if (!apiKey) {
      throw new UnauthorizedException('Header x-api-key o Authorization mancante');
    }

    const user = await this.prisma.user.findUnique({ where: { apiKey } });
    if (!user) {
      throw new UnauthorizedException('API key non valida');
    }

    req.userId = user.id;
    next();
  }
}

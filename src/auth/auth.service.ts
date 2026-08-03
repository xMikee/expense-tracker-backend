import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    const passwordMatches = user ? await bcrypt.compare(password, user.password) : false;

    if (!user || !passwordMatches) {
      throw new UnauthorizedException('Credenziali non valide');
    }

    const accessToken = await this.jwt.signAsync({ sub: user.id, email: user.email });
    return { accessToken };
  }
}

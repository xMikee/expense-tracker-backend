import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    const apiKey = randomBytes(24).toString('hex');
    const password = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        telegramChatId: dto.telegramChatId,
        apiKey,
        password,
      },
    });
    const { password: _omit, ...safeUser } = user;
    return safeUser;
  }
}

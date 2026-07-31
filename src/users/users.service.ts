import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateUserDto) {
    const apiKey = randomBytes(24).toString('hex');
    return this.prisma.user.create({
      data: {
        email: dto.email,
        telegramChatId: dto.telegramChatId,
        apiKey,
      },
    });
  }
}

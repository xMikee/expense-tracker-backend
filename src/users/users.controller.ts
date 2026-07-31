import { Body, Controller, Headers, Post, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

// Creazione utenti protetta da un ADMIN_SECRET condiviso: è un tool personale,
// non serve un vero sistema di registrazione, ma va evitato che chiunque
// trovi l'URL possa creare utenti a piacere.
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly config: ConfigService,
  ) {}

  @Post()
  create(@Headers('x-admin-key') adminKey: string, @Body() dto: CreateUserDto) {
    const expected = this.config.get<string>('ADMIN_SECRET');
    if (!expected || adminKey !== expected) {
      throw new UnauthorizedException('Chiave admin non valida');
    }
    return this.usersService.create(dto);
  }
}

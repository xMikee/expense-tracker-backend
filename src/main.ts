import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({ origin: '*' }); // restringi al dominio del frontend in produzione
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Finto auth: userId preso dall'header x-user-id, da sostituire con un vero
  // guard (JWT/API key) prima di esporre l'API pubblicamente.
  app.use((req, res, next) => {
    req.userId = req.headers['x-user-id'];
    next();
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Backend avviato su http://localhost:${port}`);
}
bootstrap();

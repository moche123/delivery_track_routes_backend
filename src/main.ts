import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    // localhost:4200 = client Angular. localhost:8081 = rider (Expo) en modo
    // web (`expo start --web`) — el nativo (Expo Go/dispositivo) no manda
    // Origin, así que CORS no le aplica.
    origin: ['http://localhost:4200', 'http://localhost:8081'],
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
  });

  const allowedOrigin = process.env.ALLOWED_ORIGINS?.trim() || 'http://localhost:3000';

  app.enableCors({
    origin: allowedOrigin,
    credentials: true,
  });

  app.setGlobalPrefix('api');

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('mitbiz POS API')
    .setDescription('mitbiz Point of Sale Backend API Documentation')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Swagger UI at /api/docs
  // app.use(
  //   '/api/docs',
  //   apiReference({
  //     content: document,
  //   }),
  // );

  SwaggerModule.setup('docs', app, document);

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();

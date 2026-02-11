import { NestFactory } from '@nestjs/core';
import { apiReference } from '@scalar/nestjs-api-reference'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false
  });

  app.enableCors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
      credentials: true,
  });

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
    app.use(
        '/api/docs',
        apiReference({
            content: document,
        }),
    )
  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

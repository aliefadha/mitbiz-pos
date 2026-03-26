import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { AppModule } from './app.module';
import { auth } from './lib/auth';

// CORS fix deployed - using comma-separated origins
// Testing env-vars-file deployment
function getAllowedOrigins(): string[] {
  const defaultOrigins = ['http://localhost:3000', 'http://localhost:5173'];

  const envOrigins = process.env.ALLOWED_ORIGINS;
  if (!envOrigins) {
    return defaultOrigins;
  }

  return envOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
  });

  const allowedOrigins = getAllowedOrigins();
  console.log('CORS allowed origins:', allowedOrigins);
  console.log('ALLOWED_ORIGINS env raw:', process.env.ALLOWED_ORIGINS);

  app.enableCors({
    origin: allowedOrigins,
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

  const authOpenApiSchema = await auth.api.generateOpenAPISchema();

  if (authOpenApiSchema.paths) {
    for (const [path, methods] of Object.entries(authOpenApiSchema.paths)) {
      const apiPath = `/api/auth${path}`;
      if (!document.paths[apiPath]) {
        document.paths[apiPath] = {};
      }
      for (const [method, spec] of Object.entries(methods as Record<string, any>)) {
        document.paths[apiPath][method] = {
          ...spec,
          tags: ['auth', ...(spec.tags || [])],
        };
      }
    }
  }

  if (authOpenApiSchema.components?.schemas) {
    document.components = document.components || {};
    (document.components as any).schemas = {
      ...document.components.schemas,
      ...(authOpenApiSchema.components.schemas as any),
    };
  }

  if (authOpenApiSchema.security) {
    document.security = [...(document.security || []), ...authOpenApiSchema.security];
  }

  // Swagger UI at /api/docs
  app.use(
    '/api/docs',
    apiReference({
      content: document,
      theme: 'none',
    }),
  );

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();

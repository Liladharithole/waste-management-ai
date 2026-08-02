import 'dotenv/config';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Logger as PinoLogger } from 'nestjs-pino';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
// Function to parse the CORS origins
function parseCorsOrigins(): string[] {
  const raw = process.env.CORS_ORIGIN;
  if (!raw?.trim()) {
    return [];
  }
  return raw
    .split(',')
    .map((o) => o.trim())
    .filter((o) => o.length > 0);
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true });
  // Trust proxy for correct client IP parsing
  app.set('trust proxy', true);
  // Logger for the app
  app.useLogger(app.get(PinoLogger));
  // Global filters for the app
  app.useGlobalFilters(new AllExceptionsFilter());
  // Global pipes for request validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  // Enable shutdown hooks for the app
  app.enableShutdownHooks();

  // CORS configuration
  const corsOrigins = parseCorsOrigins();
  if (corsOrigins.length > 0) {
    app.enableCors({
      origin: corsOrigins.length === 1 ? corsOrigins[0] : corsOrigins,
      credentials: true,
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'x-request-id',
        'x-api-key',
        'x-user-id',
        'x-tenant-id',
        'x-user-role',
      ],
      exposedHeaders: ['x-request-id', 'x-user-id', 'x-tenant-id', 'x-user-role'],
      maxAge: Number(process.env.CORS_MAX_AGE ?? 600),
      preflightContinue: false,
      optionsSuccessStatus: 204,
    });
  }
  // Logger for the CORS configuration
  const corsLogger = new Logger('CORS-CONFIGURATION');
  corsLogger.log(`CORS configuration: ${corsOrigins.length > 0 ? corsOrigins.join(', ') : 'none'}`);
  corsLogger.log(`CORS max age: ${process.env.CORS_MAX_AGE ?? 600}`);
  corsLogger.log(`CORS options success status: ${204}`);
  corsLogger.log(`CORS credentials: ${true}`);
  corsLogger.log(`CORS preflight continue: ${false}`);
  corsLogger.log(
    `CORS methods: ${['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'].join(', ')}`,
  );
  corsLogger.log(
    `CORS allowed headers: ${['Content-Type', 'Authorization', 'x-request-id', 'x-api-key', 'x-user-id', 'x-tenant-id', 'x-user-role'].join(', ')}`,
  );
  corsLogger.log(
    `CORS exposed headers: ${['x-request-id', 'x-user-id', 'x-tenant-id', 'x-user-role'].join(', ')}`,
  );

  // Swagger API Documentation Setup
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Waste Management AI API')
    .setDescription('The Waste Management AI Platform API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, swaggerDocument);

  const port = Number(process.env.PORT ?? 7001);
  await app.listen(port);
  // Logger for the bootstrap
  const bootstrapLogger = new Logger('Bootstrap');
  if (corsOrigins.length === 0) {
    bootstrapLogger.warn('CORS_ORIGIN is not set; cross-origin browser requests may be blocked.');
  }
  bootstrapLogger.log(`Server listening on http://localhost:${port}`);
  bootstrapLogger.log(`Swagger documentation available on http://localhost:${port}/api`);
}

void bootstrap();

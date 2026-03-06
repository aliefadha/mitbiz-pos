import { DB_CONNECTION } from '@/db/db.module';
import * as schema from '@/db/index';
import { Module } from '@nestjs/common';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';

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

const authProvider = {
  provide: 'AUTH',
  useFactory: (db: any) => {
    return betterAuth({
      url: process.env.BETTER_AUTH_URL,
      secret: process.env.BETTER_AUTH_SECRET,
      database: drizzleAdapter(db, {
        provider: 'pg',
        schema,
      }),
      emailAndPassword: { enabled: true },
      trustedOrigins: getAllowedOrigins(),
      plugins: [],
    });
  },
  inject: [DB_CONNECTION],
};

@Module({
  providers: [authProvider],
  exports: [authProvider],
})
export class AuthModule {}

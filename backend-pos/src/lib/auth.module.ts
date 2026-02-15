import { Module } from '@nestjs/common';
import { DB_CONNECTION } from '../db/db.module';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';

const authProvider = {
  provide: 'AUTH',
  useFactory: (db: any) => {
    return betterAuth({
      url: process.env.BETTER_AUTH_URL,
      secret: process.env.BETTER_AUTH_SECRET,
      database: drizzleAdapter(db, {
        provider: 'pg',
      }),
      emailAndPassword: { enabled: true },
      trustedOrigins: ['http://localhost:3000'],
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

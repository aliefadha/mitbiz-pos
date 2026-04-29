import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createDb } from './index';

export const DB_CONNECTION = 'DB_CONNECTION';

@Global()
@Module({
  providers: [
    {
      provide: DB_CONNECTION,
      useFactory: (configService: ConfigService) => {
        const connectionString = configService.get<string>('DATABASE_URL');
        if (!connectionString) {
          throw new Error('DATABASE_URL is not defined');
        }
        return createDb(connectionString);
      },
      inject: [ConfigService],
    },
  ],
  exports: [DB_CONNECTION],
})
export class DbModule {}

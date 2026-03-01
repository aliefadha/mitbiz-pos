import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { db } from './index';

export const DB_CONNECTION = 'DB_CONNECTION';

@Global()
@Module({
  providers: [
    {
      provide: DB_CONNECTION,
      useFactory: () => db,
    },
  ],
  exports: [DB_CONNECTION],
})
export class DbModule {}

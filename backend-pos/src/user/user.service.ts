import { Injectable, Inject } from '@nestjs/common';
import { AuthService } from '@thallesp/nestjs-better-auth';
import { auth } from '../lib/auth';
import { DB_CONNECTION } from '../db/db.module';
import type { DrizzleDB } from '../db/type';
import { user as userSchema } from '../db/schema';
import { eq } from 'drizzle-orm';
import type { CreateUserDto } from './dto';

@Injectable()
export class UserService {
  constructor(
    private authService: AuthService<typeof auth>,
    @Inject(DB_CONNECTION) private db: DrizzleDB,
  ) {}

  async createUser(data: CreateUserDto, headers: { [key: string]: string | string[] | undefined }) {
    const result = await this.authService.api.createUser({
      body: data as any,
      headers: headers as Record<string, string>,
    });

    if (data.outletId && result.user.id) {
      await this.db
        .update(userSchema)
        .set({ outletId: data.outletId })
        .where(eq(userSchema.id, result.user.id));
    }

    return result;
  }
}

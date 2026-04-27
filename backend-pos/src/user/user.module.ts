import { Global, Module } from '@nestjs/common';
import { RegisterController } from './register.controller';
import { RegisterService } from './register.service';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Global()
@Module({
  controllers: [UserController, RegisterController],
  providers: [UserService, RegisterService],
  exports: [UserService],
})
export class UserModule {}

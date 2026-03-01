import { Global, Module } from '@nestjs/common';
import { PermissionGuard } from './guards/permission.guard';
import { ScopeGuard } from './guards/scope.guard';
import { RbacService } from './services/rbac.service';

@Global()
@Module({
  providers: [RbacService, PermissionGuard, ScopeGuard],
  exports: [RbacService, PermissionGuard, ScopeGuard],
})
export class RbacModule {}

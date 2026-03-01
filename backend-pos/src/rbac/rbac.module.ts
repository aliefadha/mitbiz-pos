import { Module, Global } from '@nestjs/common';
import { RbacService } from './services/rbac.service';
import { PermissionGuard } from './guards/permission.guard';
import { ScopeGuard } from './guards/scope.guard';

@Global()
@Module({
  providers: [RbacService, PermissionGuard, ScopeGuard],
  exports: [RbacService, PermissionGuard, ScopeGuard],
})
export class RbacModule {}

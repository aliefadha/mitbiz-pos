import { Global, Module } from '@nestjs/common';
import { PermissionGuard } from './guards/permission.guard';
import { ScopeGuard } from './guards/scope.guard';
import { RbacService } from './services/rbac.service';
import { TenantAuthService } from './services/tenant-auth.service';

@Global()
@Module({
  providers: [RbacService, TenantAuthService, PermissionGuard, ScopeGuard],
  exports: [RbacService, TenantAuthService, PermissionGuard, ScopeGuard],
})
export class RbacModule {}

import { SetMetadata } from '@nestjs/common';
import { ScopeType } from '../types/rbac.types';

export const SCOPE_KEY = 'rbac:scope';

export const Scope = (scope: ScopeType) => SetMetadata(SCOPE_KEY, scope);

export const GlobalScope = () => Scope(ScopeType.GLOBAL);
export const TenantScope = () => Scope(ScopeType.TENANT);

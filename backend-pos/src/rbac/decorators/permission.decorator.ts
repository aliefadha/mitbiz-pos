import { SetMetadata } from '@nestjs/common';
import { Action, Resource } from '../types/rbac.types';

export const PERMISSION_KEY = 'rbac:permission';
export const PUBLIC_KEY = 'rbac:public';

export interface PermissionMetadata {
  resource: Resource | string;
  actions: Action[];
}

export const Permission = (resource: Resource | string, actions: Action[]) =>
  SetMetadata(PERMISSION_KEY, { resource, actions });

export const Public = () => SetMetadata(PUBLIC_KEY, true);

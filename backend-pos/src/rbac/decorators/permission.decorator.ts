import { SetMetadata } from '@nestjs/common';
import { Action, Resource } from '../types/rbac.types';

export const PERMISSION_KEY = 'rbac:permission';

export interface PermissionMetadata {
  resource: Resource | string;
  actions: Action[];
}

export const Permission = (resource: Resource | string, actions: Action[]) =>
  SetMetadata(PERMISSION_KEY, { resource, actions });

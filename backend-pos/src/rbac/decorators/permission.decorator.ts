import { SetMetadata } from '@nestjs/common';
import { Action, Resource } from '../types/rbac.types';

export const PERMISSION_KEY = 'rbac:permission';
export const PUBLIC_KEY = 'rbac:public';

export type PermissionTuple = [resource: Resource | string, actions: Action[]];
export type PermissionTupleArray = PermissionTuple[];

export interface PermissionMetadata {
  resource: Resource | string;
  actions: Action[];
}

export const Permission = (
  resourceOrArray: Resource | string | PermissionTupleArray,
  actions?: Action[],
): ReturnType<typeof SetMetadata> => {
  let permissions: PermissionTupleArray;

  if (Array.isArray(resourceOrArray) && Array.isArray(resourceOrArray[0])) {
    permissions = resourceOrArray as PermissionTupleArray;
  } else {
    permissions = [[resourceOrArray as Resource | string, actions!]];
  }

  return SetMetadata(PERMISSION_KEY, permissions);
};

export const Public = () => SetMetadata(PUBLIC_KEY, true);

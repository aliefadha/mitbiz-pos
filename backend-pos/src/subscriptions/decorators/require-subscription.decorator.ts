import { SetMetadata } from '@nestjs/common';

export const REQUIRE_SUBSCRIPTION_KEY = 'requireSubscription';
export const RequireSubscription = () => SetMetadata(REQUIRE_SUBSCRIPTION_KEY, true);

export const REQUIRE_RESOURCE_KEY = 'requireResource';
export const RequireResource = (resourceName: string) =>
  SetMetadata(REQUIRE_RESOURCE_KEY, resourceName);

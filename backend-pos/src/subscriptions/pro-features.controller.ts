import { Action, GlobalScope, Permission, PermissionGuard, ScopeGuard } from '@/rbac';
import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@thallesp/nestjs-better-auth';
import { SubscriptionsService } from './subscriptions.service';

@ApiTags('pro-features')
@Controller('pro-features')
@UseGuards(AuthGuard, PermissionGuard, ScopeGuard)
@GlobalScope()
export class ProFeaturesController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all pro features' })
  @Permission('subscription_plans', [Action.READ])
  findAll() {
    return this.subscriptionsService.findAllProFeatures();
  }
}

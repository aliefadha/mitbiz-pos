import { CurrentUser, type CurrentUserWithRole } from '@/common/decorators/current-user.decorator';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { Action, GlobalScope, Permission, PermissionGuard, ScopeGuard } from '@/rbac';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@thallesp/nestjs-better-auth';
import {
  CreateSubscriptionDto,
  CreateSubscriptionPlanDto,
  CreateSubscriptionPlanSchema,
  CreateSubscriptionSchema,
  RenewSubscriptionDto,
  RenewSubscriptionSchema,
  SubscriptionHistoryQueryDto,
  SubscriptionHistoryQuerySchema,
  SubscriptionIdDto,
  SubscriptionIdSchema,
  SubscriptionPlanIdDto,
  SubscriptionPlanIdSchema,
  SubscriptionPlanQueryDto,
  SubscriptionPlanQuerySchema,
  SubscriptionSlugDto,
  SubscriptionSlugSchema,
  UpdateSubscriptionPlanDto,
  UpdateSubscriptionPlanSchema,
} from './dto';
import { SubscriptionsService } from './subscriptions.service';

@ApiTags('subscriptions')
@Controller('subscription-plans')
@UseGuards(AuthGuard, PermissionGuard, ScopeGuard)
export class SubscriptionPlansController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('history')
  @ApiOperation({ summary: 'Get all subscription history across tenants' })
  @ApiQuery({
    name: 'action',
    required: false,
    enum: ['subscribed', 'renewed', 'changed', 'cancelled'],
  })
  @ApiQuery({
    name: 'tenantId',
    required: false,
    schema: { type: 'string' },
    description: 'Filter by tenant ID',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    schema: { type: 'string' },
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    schema: { type: 'string' },
    description: 'Items per page (max 100)',
  })
  @UsePipes(new ZodValidationPipe(SubscriptionHistoryQuerySchema, 'query'))
  @GlobalScope()
  @Permission('subscription_plans', [Action.READ])
  getAllHistory(@Query() query: SubscriptionHistoryQueryDto) {
    return this.subscriptionsService.getAllSubscriptionHistory(query);
  }

  @Get('active-subscriptions/tenants')
  @ApiOperation({ summary: 'Get all tenants with active subscriptions' })
  @Permission('subscription_plans', [Action.READ])
  getTenantsWithActiveSubscriptions() {
    return this.subscriptionsService.getTenantsWithActiveSubscriptions();
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Get subscription history for a subscription plan' })
  @ApiParam({ name: 'id', required: true, description: 'Subscription plan ID' })
  @ApiQuery({
    name: 'action',
    required: false,
    enum: ['subscribed', 'renewed', 'changed', 'cancelled'],
  })
  @ApiQuery({
    name: 'page',
    required: false,
    schema: { type: 'string' },
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    schema: { type: 'string' },
    description: 'Items per page',
  })
  @UsePipes(new ZodValidationPipe(SubscriptionPlanIdSchema, 'params'))
  @UsePipes(new ZodValidationPipe(SubscriptionHistoryQuerySchema, 'query'))
  @Permission('subscription_plans', [Action.READ])
  getPlanHistory(
    @Param() { id }: SubscriptionPlanIdDto,
    @Query() query: SubscriptionHistoryQueryDto,
  ) {
    return this.subscriptionsService.getPlanSubscriptionHistory(id, query);
  }

  @Put('subscriptions/:subscriptionId/cancel')
  @ApiOperation({ summary: 'Cancel a subscription by ID' })
  @ApiParam({ name: 'subscriptionId', required: true, description: 'Subscription ID' })
  @UsePipes(new ZodValidationPipe(SubscriptionIdSchema, 'params'))
  @Permission('subscription_plans', [Action.UPDATE])
  cancelSubscription(@Param() { subscriptionId }: SubscriptionIdDto) {
    return this.subscriptionsService.cancelSubscriptionById(subscriptionId);
  }

  @Put('subscriptions/:subscriptionId/renew')
  @ApiOperation({ summary: 'Renew a subscription by ID' })
  @ApiParam({ name: 'subscriptionId', required: true, description: 'Subscription ID' })
  @UsePipes(new ZodValidationPipe(SubscriptionIdSchema, 'params'))
  @Permission('subscription_plans', [Action.UPDATE])
  renewSubscription(@Param() { subscriptionId }: SubscriptionIdDto) {
    return this.subscriptionsService.renewSubscriptionById(subscriptionId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all subscription plans' })
  @ApiQuery({
    name: 'isActive',
    required: false,
    schema: { type: 'string' },
    description: 'Filter by active status (true/false)',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    schema: { type: 'string' },
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    schema: { type: 'string' },
    description: 'Items per page',
  })
  @UsePipes(new ZodValidationPipe(SubscriptionPlanQuerySchema, 'query'))
  findAll(@Query() query: SubscriptionPlanQueryDto) {
    return this.subscriptionsService.findAllPlans(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get subscription plan by ID' })
  @ApiParam({ name: 'id', required: true, description: 'Subscription plan ID' })
  @UsePipes(new ZodValidationPipe(SubscriptionPlanIdSchema, 'params'))
  @Permission('subscription_plans', [Action.READ])
  findById(@Param() { id }: SubscriptionPlanIdDto) {
    return this.subscriptionsService.findPlanById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new subscription plan' })
  @ApiBody({ type: CreateSubscriptionPlanDto })
  @UsePipes(new ZodValidationPipe(CreateSubscriptionPlanSchema))
  @Permission('subscription_plans', [Action.CREATE])
  create(@Body() data: CreateSubscriptionPlanDto) {
    return this.subscriptionsService.createPlan(data);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a subscription plan' })
  @ApiParam({ name: 'id', required: true, description: 'Subscription plan ID' })
  @ApiBody({ type: UpdateSubscriptionPlanDto })
  @UsePipes(new ZodValidationPipe(SubscriptionPlanIdSchema, 'params'))
  @UsePipes(new ZodValidationPipe(UpdateSubscriptionPlanSchema))
  @Permission('subscription_plans', [Action.UPDATE])
  update(@Param() { id }: SubscriptionPlanIdDto, @Body() data: UpdateSubscriptionPlanDto) {
    return this.subscriptionsService.updatePlan(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deactivate a subscription plan' })
  @ApiParam({ name: 'id', required: true, description: 'Subscription plan ID' })
  @UsePipes(new ZodValidationPipe(SubscriptionPlanIdSchema, 'params'))
  @Permission('subscription_plans', [Action.DELETE])
  remove(@Param() { id }: SubscriptionPlanIdDto) {
    return this.subscriptionsService.deletePlan(id);
  }

  @Get(':id/subscriptions')
  @ApiOperation({ summary: 'Get all subscriptions for a subscription plan' })
  @ApiParam({ name: 'id', required: true, description: 'Subscription plan ID' })
  @UsePipes(new ZodValidationPipe(SubscriptionPlanIdSchema, 'params'))
  @Permission('subscription_plans', [Action.READ])
  getPlanSubscriptions(@Param() { id }: SubscriptionPlanIdDto) {
    return this.subscriptionsService.getSubscriptionsByPlanId(id);
  }
}

@ApiTags('subscriptions')
@Controller('tenants/:slug/subscription')
@UseGuards(AuthGuard, PermissionGuard, ScopeGuard)
export class TenantSubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get()
  @ApiOperation({ summary: 'Get tenant subscription' })
  @ApiParam({ name: 'slug', required: true, description: 'Tenant slug' })
  @UsePipes(new ZodValidationPipe(SubscriptionSlugSchema, 'params'))
  getSubscription(
    @Param() { slug }: SubscriptionSlugDto,
    @CurrentUser() user: CurrentUserWithRole,
  ) {
    return this.subscriptionsService.getTenantSubscription(slug, user);
  }

  @Post()
  @ApiOperation({ summary: 'Create subscription for tenant' })
  @ApiParam({ name: 'slug', required: true, description: 'Tenant slug' })
  @ApiBody({ type: CreateSubscriptionDto })
  @UsePipes(new ZodValidationPipe(SubscriptionSlugSchema, 'params'))
  @UsePipes(new ZodValidationPipe(CreateSubscriptionSchema))
  @Permission('subscriptions', [Action.CREATE])
  create(
    @Param() { slug }: SubscriptionSlugDto,
    @Body() data: CreateSubscriptionDto,
    @CurrentUser() user: CurrentUserWithRole,
  ) {
    return this.subscriptionsService.createSubscription(slug, data, user);
  }

  @Put('renew')
  @ApiOperation({ summary: 'Renew tenant subscription' })
  @ApiParam({ name: 'slug', required: true, description: 'Tenant slug' })
  @ApiBody({ type: RenewSubscriptionDto })
  @UsePipes(new ZodValidationPipe(SubscriptionSlugSchema, 'params'))
  @UsePipes(new ZodValidationPipe(RenewSubscriptionSchema))
  @Permission('subscriptions', [Action.UPDATE])
  renew(
    @Param() { slug }: SubscriptionSlugDto,
    @Body() data: RenewSubscriptionDto,
    @CurrentUser() user: CurrentUserWithRole,
  ) {
    return this.subscriptionsService.renewSubscription(slug, data, user);
  }

  @Put('cancel')
  @ApiOperation({ summary: 'Cancel tenant subscription' })
  @ApiParam({ name: 'slug', required: true, description: 'Tenant slug' })
  @UsePipes(new ZodValidationPipe(SubscriptionSlugSchema, 'params'))
  @Permission('subscriptions', [Action.UPDATE])
  cancel(@Param() { slug }: SubscriptionSlugDto, @CurrentUser() user: CurrentUserWithRole) {
    return this.subscriptionsService.cancelSubscription(slug, user);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get subscription history for tenant' })
  @ApiParam({ name: 'slug', required: true, description: 'Tenant slug' })
  @ApiQuery({
    name: 'action',
    required: false,
    enum: ['subscribed', 'renewed', 'changed', 'cancelled'],
  })
  @ApiQuery({
    name: 'page',
    required: false,
    schema: { type: 'string' },
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    schema: { type: 'string' },
    description: 'Items per page',
  })
  @UsePipes(new ZodValidationPipe(SubscriptionSlugSchema, 'params'))
  @UsePipes(new ZodValidationPipe(SubscriptionHistoryQuerySchema, 'query'))
  @Permission('subscriptions', [Action.READ])
  getHistory(
    @Param() { slug }: SubscriptionSlugDto,
    @Query() query: SubscriptionHistoryQueryDto,
    @CurrentUser() user: CurrentUserWithRole,
  ) {
    return this.subscriptionsService.getSubscriptionHistory(slug, query, user);
  }
}

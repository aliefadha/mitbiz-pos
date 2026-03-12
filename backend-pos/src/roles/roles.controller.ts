import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { Action, GlobalScope, Permission, PermissionGuard, Public, ScopeGuard } from '@/rbac';
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
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  CreateResourceDto,
  CreateResourceSchema,
  CreateRoleDto,
  CreateRoleSchema,
  PermissionDto,
  PermissionSchema,
  ResourceIdDto,
  ResourceIdSchema,
  RoleIdDto,
  RoleIdSchema,
  RoleQueryDto,
  SetPermissionsDto,
  SetPermissionsSchema,
  UpdateResourceDto,
  UpdateResourceSchema,
  UpdateRoleDto,
  UpdateRoleSchema,
} from './dto';
import { RolesService } from './roles.service';

@ApiTags('roles')
@Controller('roles')
@UseGuards(JwtAuthGuard, PermissionGuard, ScopeGuard)
@GlobalScope()
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all roles' })
  @Permission('roles', [Action.READ])
  findAll(@Query() query: RoleQueryDto) {
    return this.rolesService.findAll(query.tenantId);
  }

  // ============ RESOURCES ============

  @Get('resources')
  @ApiOperation({ summary: 'Get all resources' })
  @ApiResponse({ status: 200, description: 'Returns all resources' })
  async findAllResources() {
    return this.rolesService.findAllResources();
  }

  @Get('resources/:id')
  @ApiOperation({ summary: 'Get resource by ID' })
  @UsePipes(new ZodValidationPipe(ResourceIdSchema, 'params'))
  @Permission('roles', [Action.READ])
  findResourceById(@Param() { id }: ResourceIdDto) {
    return this.rolesService.findResourceById(id);
  }

  @Post('resources')
  @ApiOperation({ summary: 'Create a new resource' })
  @UsePipes(new ZodValidationPipe(CreateResourceSchema))
  @Permission('roles', [Action.CREATE])
  createResource(@Body() data: CreateResourceDto) {
    return this.rolesService.createResource(data);
  }

  @Put('resources/:id')
  @ApiOperation({ summary: 'Update a resource' })
  @UsePipes(new ZodValidationPipe(ResourceIdSchema, 'params'))
  @UsePipes(new ZodValidationPipe(UpdateResourceSchema))
  @Permission('roles', [Action.UPDATE])
  updateResource(@Param() { id }: ResourceIdDto, @Body() data: UpdateResourceDto) {
    return this.rolesService.updateResource(id, data);
  }

  @Delete('resources/:id')
  @ApiOperation({ summary: 'Delete a resource' })
  @UsePipes(new ZodValidationPipe(ResourceIdSchema, 'params'))
  @Permission('roles', [Action.DELETE])
  deleteResource(@Param() { id }: ResourceIdDto) {
    return this.rolesService.deleteResource(id);
  }

  // ============ ROLES BY ID  ============

  @Get(':id')
  @ApiOperation({ summary: 'Get role by ID' })
  @UsePipes(new ZodValidationPipe(RoleIdSchema, 'params'))
  @Permission('roles', [Action.READ])
  @Public()
  findById(@Param() { id }: RoleIdDto) {
    return this.rolesService.findById(id);
  }

  @Get(':id/permissions')
  @ApiOperation({ summary: 'Get permissions for a role' })
  @UsePipes(new ZodValidationPipe(RoleIdSchema, 'params'))
  @Permission('roles', [Action.READ])
  @Public()
  getPermissions(@Param() { id }: RoleIdDto) {
    return this.rolesService.getPermissions(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new role' })
  @UsePipes(new ZodValidationPipe(CreateRoleSchema))
  @Permission('roles', [Action.CREATE])
  create(@Body() data: CreateRoleDto) {
    return this.rolesService.create(data);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a role' })
  @UsePipes(new ZodValidationPipe(RoleIdSchema, 'params'))
  @UsePipes(new ZodValidationPipe(UpdateRoleSchema))
  @Permission('roles', [Action.UPDATE])
  update(@Param() { id }: RoleIdDto, @Body() data: UpdateRoleDto) {
    return this.rolesService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a role' })
  @UsePipes(new ZodValidationPipe(RoleIdSchema, 'params'))
  @Permission('roles', [Action.DELETE])
  delete(@Param() { id }: RoleIdDto) {
    return this.rolesService.delete(id);
  }

  @Put(':id/permissions')
  @ApiOperation({ summary: 'Set permissions for a role' })
  @UsePipes(new ZodValidationPipe(RoleIdSchema, 'params'))
  @UsePipes(new ZodValidationPipe(SetPermissionsSchema))
  @Permission('roles', [Action.UPDATE])
  setPermissions(@Param() { id }: RoleIdDto, @Body() { permissions }: SetPermissionsDto) {
    return this.rolesService.setPermissions(id, permissions);
  }

  @Post(':id/permissions')
  @ApiOperation({ summary: 'Add permission to a role' })
  @UsePipes(new ZodValidationPipe(RoleIdSchema, 'params'))
  @UsePipes(new ZodValidationPipe(PermissionSchema))
  @Permission('roles', [Action.UPDATE])
  addPermission(@Param() { id }: RoleIdDto, @Body() body: PermissionDto) {
    return this.rolesService.addPermission(id, body.resource, body.action);
  }

  @Delete(':id/permissions')
  @ApiOperation({ summary: 'Remove permission from a role' })
  @UsePipes(new ZodValidationPipe(RoleIdSchema, 'params'))
  @UsePipes(new ZodValidationPipe(PermissionSchema))
  @Permission('roles', [Action.UPDATE])
  removePermission(@Param() { id }: RoleIdDto, @Body() body: PermissionDto) {
    return this.rolesService.removePermission(id, body.resource, body.action);
  }
}

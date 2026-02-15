/**
 * DTO (Data Transfer Object) Index
 *
 * This module exports all DTOs for validation in the POS system.
 *
 * Usage:
 * import { CreateProductSchema, CreateOrderSchema, ZodValidationPipe } from '@/dto';
 */

// Re-export all Product DTOs
export * from './products/product.dto';

// Re-export all Order DTOs
export * from './orders/order.dto';

// Re-export validation pipe
export * from '../common/pipes/zod-validation.pipe';

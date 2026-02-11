import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import * as zod from 'zod';
import {fromZodError} from 'zod-validation-error';

/**
 * Zod Validation Pipe for NestJS
 *
 * Usage in controllers:
 *
 * @Post()
 * @UsePipes(new ZodValidationPipe(CreateProductSchema))
 * createProduct(@Body() body: z.infer<typeof CreateProductSchema>) {
 *   return body;
 * }
 *
 * Or use the @ZodPipe decorator from a custom decorator
 */
@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: zod.ZodSchema) {
  }

  transform(value: unknown, metadata: ArgumentMetadata): unknown {
    if (metadata.type !== 'body') {
      return value;
    }

    try {
      return this.schema.parse(value);
    } catch (error) {
      if (error instanceof zod.ZodError) {
        const validationError = fromZodError(error);
        throw new BadRequestException({
          message: 'Validation failed',
          errors: validationError.details,
        });
      }
      throw new BadRequestException('Invalid input data');
    }
  }
}

/**
 * Helper function to create a Zod validation pipe with a schema
 */
export const createZodPipe = (schema: zod.ZodSchema) => new ZodValidationPipe(schema);

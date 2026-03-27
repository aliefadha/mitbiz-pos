import { existsSync, mkdirSync } from 'node:fs';
import { extname } from 'node:path';
import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { diskStorage } from 'multer';
import type { FileFilterCallback, Multer } from 'multer';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';

export interface FileUploadOptions {
  fieldName?: string;
  dest?: string;
  allowedMimeTypes?: string[];
  maxSize?: number;
}

export const FILE_UPLOAD_OPTIONS_KEY = 'file_upload_options';

@Injectable()
export class FileUploadInterceptor implements NestInterceptor {
  private readonly options: Required<FileUploadOptions>;

  constructor(options: FileUploadOptions = {}) {
    this.options = {
      fieldName: options.fieldName || 'file',
      dest: options.dest || './uploads',
      allowedMimeTypes: options.allowedMimeTypes || [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
      ],
      maxSize: options.maxSize || 5 * 1024 * 1024,
    };
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest();

    return from(this.handleUpload(request)).pipe(
      switchMap((file) => {
        if (!file) {
          return next.handle();
        }
        request.file = file;
        return next.handle();
      }),
    );
  }

  private handleUpload(request: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const { fieldName, dest, allowedMimeTypes, maxSize } = this.options;

      if (!existsSync(dest)) {
        mkdirSync(dest, { recursive: true });
      }

      const storage = diskStorage({
        destination: (req, file, cb) => {
          cb(null, dest);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          const ext = extname(file.originalname);
          const filename = `${fieldName}-${uniqueSuffix}${ext}`;
          cb(null, filename);
        },
      });

      const fileFilter = (req: any, file: Express.Multer.File, cb: FileFilterCallback) => {
        if (!allowedMimeTypes.includes(file.mimetype)) {
          cb(
            new BadRequestException(
              `File type not allowed. Allowed types: ${allowedMimeTypes.join(', ')}`,
            ),
          );
          return;
        }
        cb(null, true);
      };

      const multer = require('multer');
      const upload = multer({
        storage,
        fileFilter,
        limits: { fileSize: maxSize },
      });

      const uploadHandler = upload.single(fieldName);

      uploadHandler(request, {}, (err: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(request.file);
        }
      });
    });
  }
}

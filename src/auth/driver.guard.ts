import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';
import type { JwtPayload } from './jwt-auth.guard';

/**
 * Debe usarse siempre junto a `JwtAuthGuard` (antes en la cadena de guards):
 * `@UseGuards(JwtAuthGuard, DriverGuard)`. Asume que `request.user` ya está
 * seteado por `JwtAuthGuard`.
 */
@Injectable()
export class DriverGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: JwtPayload }>();

    if (request.user?.tipo !== 'driver') {
      throw new ForbiddenException('Requiere cuenta de tipo driver');
    }

    return true;
  }
}

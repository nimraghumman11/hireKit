import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser>(err: Error, user: TUser): TUser {
    if (err || !user) {
      throw new UnauthorizedException({
        error: 'AUTH_INVALID',
        message: 'Invalid or missing authentication token',
      });
    }
    return user;
  }
}

import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class CronSecretGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const cronSecretHeader = request.headers['x-cron-secret'];
    const expectedSecret = process.env.CRON_SECRET_KEY || 'default-dev-cron-secret';

    if (!cronSecretHeader || cronSecretHeader !== expectedSecret) {
      throw new UnauthorizedException('Invalid or missing X-CRON-SECRET header key.');
    }

    return true;
  }
}

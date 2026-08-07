import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'] || request.query.apiKey;

    const validApiKey = process.env.VENDOR_API_KEY;

    if (!apiKey || apiKey !== validApiKey) {
      throw new UnauthorizedException('Invalid or missing X-API-KEY header.');
    }

    return true;
  }
}

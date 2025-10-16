import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { verifyToken } from '../jwt';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const req = context.switchToHttp().getRequest<any>();
    const authHeader: string | undefined = req.headers?.['authorization'] ?? req.headers?.['Authorization'];
    let token: string | undefined;

    if (typeof authHeader === 'string' && authHeader.toLowerCase().startsWith('bearer ')) {
      token = authHeader.substring(7).trim();
    }
    // Fallback to cookie
    if (!token) {
      const cookieToken = req.cookies?.['session_token'];
      if (typeof cookieToken === 'string' && cookieToken.length > 0) token = cookieToken;
    }

    if (!token) throw new UnauthorizedException('Missing authentication token');
    const payload = verifyToken<{ sub: string; email?: string }>(token);
    if (!payload || !payload.sub) throw new UnauthorizedException('Invalid or expired token');
    // Attach user to request for downstream ownership checks
    req.user = { id: payload.sub, email: payload.email };
    return true;
  }
}
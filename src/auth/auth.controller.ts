import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import type { AuthUser, LoginResult } from './auth.service';
import { CurrentUser } from './current-user.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';

export type JwtPayload = {
  sub: string | number;
  [key: string]: unknown;
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login/google')
  loginWithGoogle(@Body('token') token: string): Promise<LoginResult> {
    return this.authService.loginWithGoogle(token);
  }

  @Post('refresh')
  refresh(@Body('refreshToken') refreshToken: string): Promise<LoginResult> {
    return this.authService.refresh(refreshToken);
  }

  @Post('logout')
  async logout(
    @Body('refreshToken') refreshToken: string,
  ): Promise<{ ok: true }> {
    await this.authService.logout(refreshToken);
    return { ok: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: JwtPayload): Promise<AuthUser> {
    return this.authService.me(Number(user.sub));
  }
}

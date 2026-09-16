import { Body, Controller, Post } from '@nestjs/common';
import { AuthService, LoginResult } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login/google')
  loginWithGoogle(@Body('token') token: string): Promise<LoginResult> {
    return this.authService.loginWithGoogle(token);
  }
}

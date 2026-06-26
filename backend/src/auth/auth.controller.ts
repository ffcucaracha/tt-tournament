import { Body, Controller, Post } from "@nestjs/common";
import { IsEmail, IsString, MinLength } from "class-validator";
import { AuthService } from "./auth.service";

class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(3)
  password!: string;
}

@Controller("admin/auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  login(@Body() body: LoginDto): Promise<Record<string, unknown>> {
    return this.authService.login(body.email, body.password);
  }

  @Post("logout")
  logout(): Record<string, boolean> {
    return { ok: true };
  }
}

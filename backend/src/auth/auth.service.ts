import { Injectable, OnModuleInit, UnauthorizedException } from "@nestjs/common";
import { compare, hash } from "bcryptjs";
import { sign, verify } from "jsonwebtoken";
import { PrismaService } from "../common/prisma.service";

interface AdminTokenPayload {
  sub: string;
  email: string;
}

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    await this.ensureDefaultAdmin();
  }

  async ensureDefaultAdmin(): Promise<void> {
    const email = process.env.ADMIN_EMAIL ?? "admin@example.com";
    const password = process.env.ADMIN_PASSWORD ?? "admin";
    const existing = await this.prisma.adminUser.findUnique({ where: { email } });
    const passwordHash = await hash(password, 10);

    if (!existing) {
      await this.prisma.adminUser.create({
        data: {
          email,
          passwordHash
        }
      });
      return;
    }

    const matched = await compare(password, existing.passwordHash);
    if (!matched) {
      await this.prisma.adminUser.update({
        where: { id: existing.id },
        data: { passwordHash }
      });
    }
  }

  async login(email: string, password: string): Promise<{ accessToken: string; admin: { id: string; email: string } }> {
    const admin = await this.prisma.adminUser.findUnique({ where: { email } });
    if (!admin) {
      throw new UnauthorizedException("Invalid credentials");
    }
    const matched = await compare(password, admin.passwordHash);
    if (!matched) {
      throw new UnauthorizedException("Invalid credentials");
    }
    const payload: AdminTokenPayload = {
      sub: admin.id,
      email: admin.email
    };
    const secret = process.env.JWT_SECRET ?? "change_me";
    const accessToken = sign(payload, secret, { expiresIn: "12h" });
    return {
      accessToken,
      admin: {
        id: admin.id,
        email: admin.email
      }
    };
  }

  verifyToken(token: string): { id: string; email: string } {
    const secret = process.env.JWT_SECRET ?? "change_me";
    const payload = verify(token, secret) as AdminTokenPayload;
    return { id: payload.sub, email: payload.email };
  }
}

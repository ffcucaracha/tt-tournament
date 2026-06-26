import { Controller, Param, Post, UseGuards } from "@nestjs/common";
import { AdminAuthGuard } from "../auth/admin-auth.guard";
import { TelegramService } from "./telegram.service";

@Controller("admin/tournaments/:id/telegram")
@UseGuards(AdminAuthGuard)
export class TelegramController {
  constructor(private readonly telegramService: TelegramService) {}

  @Post("send-next-matches")
  send(@Param("id") tournamentId: string): Promise<Record<string, unknown>> {
    return this.telegramService.sendNextMatches(tournamentId);
  }
}

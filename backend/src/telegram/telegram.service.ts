import { Injectable } from "@nestjs/common";
import { DataStoreService } from "../common/data-store.service";

@Injectable()
export class TelegramService {
  constructor(private readonly store: DataStoreService) {}

  async sendNextMatches(tournamentId: string): Promise<Record<string, unknown>> {
    const preview = await this.store.buildTelegramPreview(tournamentId);
    return {
      ok: true,
      sentAt: new Date().toISOString(),
      message: preview.message
    };
  }
}

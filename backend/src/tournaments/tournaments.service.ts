import { Injectable } from "@nestjs/common";
import { TournamentStatus } from "@prisma/client";
import { DataStoreService } from "../common/data-store.service";

@Injectable()
export class TournamentsService {
  constructor(private readonly store: DataStoreService) {}

  async listAdminTournaments(): Promise<Record<string, unknown>> {
    return { items: await this.store.listTournaments() };
  }

  createTournament(input: {
    title: string;
    description?: string;
    setsToWin?: number;
    tvIntervalSec?: number;
    date?: string | null;
    isActive?: boolean;
    roundsCount?: number;
  }): Promise<Record<string, unknown>> {
    return this.store.createTournament(input);
  }

  async getTournament(tournamentId: string): Promise<Record<string, unknown>> {
    const tournament = await this.store.getTournament(tournamentId);
    return tournament as unknown as Record<string, unknown>;
  }

  updateTournament(
    tournamentId: string,
    input: {
      title?: string;
      description?: string;
      setsToWin?: number;
      tvIntervalSec?: number;
      date?: string | null;
      isTelegramEnabled?: boolean;
      isActive?: boolean;
      status?: TournamentStatus;
      confirmStatusChange?: boolean;
      confirmResetResults?: boolean;
      roundsCount?: number;
    }
  ): Promise<Record<string, unknown>> {
    return this.store.updateTournament(tournamentId, input);
  }

  async deleteTournament(tournamentId: string): Promise<Record<string, boolean>> {
    await this.store.deleteTournament(tournamentId);
    return { ok: true };
  }

  async getAuditLog(tournamentId: string): Promise<Record<string, unknown>> {
    return { items: await this.store.listAuditRecords(tournamentId) };
  }

  getPublicOverview(tournamentId: string): Promise<Record<string, unknown>> {
    return this.store.getPublicOverview(tournamentId);
  }

  getPublicParticipants(tournamentId: string): Promise<Record<string, unknown>> {
    return this.store.getPublicParticipants(tournamentId);
  }

  getPublicSchedule(tournamentId: string): Promise<Record<string, unknown>> {
    return this.store.getPublicSchedule(tournamentId);
  }

  getPublicBracket(tournamentId: string): Promise<Record<string, unknown>> {
    return this.store.getPublicBracket(tournamentId);
  }

  getPublicResults(tournamentId: string): Promise<Record<string, unknown>> {
    return this.store.getPublicResults(tournamentId);
  }

  getPublicTribeStats(tournamentId: string): Promise<Record<string, unknown>> {
    return this.store.getPublicTribeStats(tournamentId);
  }
}

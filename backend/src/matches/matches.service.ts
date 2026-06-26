import { Injectable } from "@nestjs/common";
import { DataStoreService } from "../common/data-store.service";
import { MatchStatus, MatchView } from "../common/types";

@Injectable()
export class MatchesService {
  constructor(private readonly store: DataStoreService) {}

  async list(tournamentId: string): Promise<Record<string, unknown>> {
    return { items: await this.store.listMatches(tournamentId) };
  }

  async listRounds(tournamentId: string): Promise<Record<string, unknown>> {
    return { items: await this.store.listRounds(tournamentId) };
  }

  async getRoundMatches(tournamentId: string, roundNumber: number): Promise<Record<string, unknown>> {
    return { items: await this.store.getRoundMatches(tournamentId, roundNumber) };
  }

  async generateNextRound(tournamentId: string): Promise<Record<string, unknown>> {
    return this.store.generateNextRound(tournamentId);
  }

  update(
    matchId: string,
    input: {
      status?: MatchStatus;
      scheduledAt?: string | null;
    }
  ): Promise<MatchView> {
    return this.store.updateMatch(matchId, input);
  }

  schedule(matchId: string, scheduledAt: string, adminId: string | null): Promise<MatchView> {
    return this.store.scheduleMatch(matchId, scheduledAt, adminId);
  }

  scheduleAuto(matchId: string, adminId: string | null): Promise<MatchView> {
    return this.store.autoScheduleMatch(matchId, adminId);
  }

  setResult(
    matchId: string,
    input: {
      winnerId: string;
      scoreA: number;
      scoreB: number;
    },
    adminId: string | null
  ): Promise<MatchView> {
    return this.store.setMatchResult(matchId, input, adminId);
  }

  resetResult(matchId: string, adminId: string | null): Promise<MatchView> {
    return this.store.resetMatchResult(matchId, adminId);
  }
}

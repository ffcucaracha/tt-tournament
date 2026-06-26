import { Tournament } from "@prisma/client";
import { Injectable } from "@nestjs/common";
import { AuditRecord, MatchView } from "./types";
import { PrismaService } from "./prisma.service";
import { AuditRecordsService } from "./store/audit-records.service";
import { MatchesStoreService } from "./store/matches-store.service";
import { ParticipantsStoreService } from "./store/participants-store.service";
import { TournamentsStoreService } from "./store/tournaments-store.service";
import {
  CreateParticipantInput,
  CreateTournamentInput,
  SetResultInput,
  UpdateMatchInput,
  UpdateParticipantInput,
  UpdateTournamentInput
} from "./store/store.types";

@Injectable()
export class DataStoreService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tournamentsStore: TournamentsStoreService,
    private readonly participantsStore: ParticipantsStoreService,
    private readonly matchesStore: MatchesStoreService,
    private readonly auditRecords: AuditRecordsService
  ) {}

  listTournaments(): Promise<Array<Record<string, unknown>>> {
    return this.tournamentsStore.listTournaments();
  }

  getTournament(tournamentId: string): Promise<Tournament> {
    return this.tournamentsStore.getTournament(tournamentId);
  }

  createTournament(input: CreateTournamentInput): Promise<Record<string, unknown>> {
    return this.tournamentsStore.createTournament(input);
  }

  async updateTournament(tournamentId: string, input: UpdateTournamentInput): Promise<Record<string, unknown>> {
    const resolvedTournamentId = await this.tournamentsStore.resolveTournamentId(tournamentId);
    return this.tournamentsStore.updateTournament(resolvedTournamentId, input);
  }

  async deleteTournament(tournamentId: string): Promise<void> {
    const resolvedTournamentId = await this.tournamentsStore.resolveTournamentId(tournamentId);
    return this.tournamentsStore.deleteTournament(resolvedTournamentId);
  }

  async listParticipants(tournamentId: string): Promise<Array<Record<string, unknown>>> {
    const resolvedTournamentId = await this.tournamentsStore.resolveTournamentId(tournamentId);
    return this.participantsStore.listParticipants(resolvedTournamentId);
  }

  async createParticipant(tournamentId: string, input: CreateParticipantInput): Promise<Record<string, unknown>> {
    const resolvedTournamentId = await this.tournamentsStore.resolveTournamentId(tournamentId);
    return this.participantsStore.createParticipant(resolvedTournamentId, input);
  }

  updateParticipant(participantId: string, input: UpdateParticipantInput): Promise<Record<string, unknown>> {
    return this.participantsStore.updateParticipant(participantId, input);
  }

  deleteParticipant(participantId: string): Promise<void> {
    return this.participantsStore.deleteParticipant(participantId);
  }

  async seedTournament(tournamentId: string, adminId: string | null): Promise<{ seeded: Array<Record<string, unknown>> }> {
    const resolvedTournamentId = await this.tournamentsStore.resolveTournamentId(tournamentId);
    return this.participantsStore.seedTournament(resolvedTournamentId, adminId);
  }

  async listMatches(tournamentId: string): Promise<MatchView[]> {
    const resolvedTournamentId = await this.tournamentsStore.resolveTournamentId(tournamentId);
    return this.matchesStore.listMatches(resolvedTournamentId);
  }

  async listRounds(tournamentId: string): Promise<Array<Record<string, unknown>>> {
    const resolvedTournamentId = await this.tournamentsStore.resolveTournamentId(tournamentId);
    return this.matchesStore.listRounds(resolvedTournamentId);
  }

  async getRoundMatches(tournamentId: string, roundNumber: number): Promise<MatchView[]> {
    const resolvedTournamentId = await this.tournamentsStore.resolveTournamentId(tournamentId);
    return this.matchesStore.getRoundMatches(resolvedTournamentId, roundNumber);
  }

  async generateNextRound(tournamentId: string): Promise<{ round: number }> {
    const resolvedTournamentId = await this.tournamentsStore.resolveTournamentId(tournamentId);
    return this.matchesStore.createNextRound(resolvedTournamentId);
  }

  updateMatch(matchId: string, input: UpdateMatchInput): Promise<MatchView> {
    return this.matchesStore.updateMatch(matchId, input);
  }

  scheduleMatch(matchId: string, scheduledAt: string, adminId: string | null): Promise<MatchView> {
    return this.matchesStore.scheduleMatch(matchId, scheduledAt, adminId);
  }

  autoScheduleMatch(matchId: string, adminId: string | null): Promise<MatchView> {
    return this.matchesStore.autoScheduleMatch(matchId, adminId);
  }

  setMatchResult(matchId: string, input: SetResultInput, adminId: string | null): Promise<MatchView> {
    return this.matchesStore.setMatchResult(matchId, input, adminId);
  }

  resetMatchResult(matchId: string, adminId: string | null): Promise<MatchView> {
    return this.matchesStore.resetMatchResult(matchId, adminId);
  }

  async getPublicOverview(tournamentId: string): Promise<Record<string, unknown>> {
    const resolvedTournamentId = await this.tournamentsStore.resolveTournamentId(tournamentId);
    return this.tournamentsStore.getPublicOverview(resolvedTournamentId);
  }

  async getPublicParticipants(tournamentId: string): Promise<Record<string, unknown>> {
    const resolvedTournamentId = await this.tournamentsStore.resolveTournamentId(tournamentId);
    return this.participantsStore.getPublicParticipants(resolvedTournamentId);
  }

  async getPublicSchedule(tournamentId: string): Promise<Record<string, unknown>> {
    const resolvedTournamentId = await this.tournamentsStore.resolveTournamentId(tournamentId);
    return this.matchesStore.getPublicSchedule(resolvedTournamentId);
  }

  async getPublicBracket(tournamentId: string): Promise<Record<string, unknown>> {
    const resolvedTournamentId = await this.tournamentsStore.resolveTournamentId(tournamentId);
    return this.matchesStore.getPublicBracket(resolvedTournamentId);
  }

  async getPublicResults(tournamentId: string): Promise<Record<string, unknown>> {
    const resolvedTournamentId = await this.tournamentsStore.resolveTournamentId(tournamentId);
    return this.matchesStore.getPublicResults(resolvedTournamentId);
  }

  async getPublicTribeStats(tournamentId: string): Promise<Record<string, unknown>> {
    const resolvedTournamentId = await this.tournamentsStore.resolveTournamentId(tournamentId);
    return this.matchesStore.getPublicTribeStats(resolvedTournamentId);
  }

  async listAuditRecords(tournamentId: string): Promise<AuditRecord[]> {
    const resolvedTournamentId = await this.tournamentsStore.resolveTournamentId(tournamentId);
    await this.tournamentsStore.getTournament(resolvedTournamentId);
    return this.auditRecords.listAuditRecords(resolvedTournamentId);
  }

  async buildTelegramPreview(tournamentId: string): Promise<{ message: string }> {
    const resolvedTournamentId = await this.tournamentsStore.resolveTournamentId(tournamentId);
    return this.matchesStore.buildTelegramPreview(resolvedTournamentId);
  }
}

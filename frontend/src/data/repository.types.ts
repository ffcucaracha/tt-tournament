import {
  AuditRecord,
  BracketResponse,
  CsvImportResult,
  MatchView,
  Participant,
  PublicOverviewResponse,
  ResultsResponse,
  ScheduleResponse,
  Tournament,
  TournamentStatus
} from "../api/types";

export interface TournamentRepository {
  getPublicOverview(tournamentId: string): Promise<PublicOverviewResponse>;
  getParticipants(tournamentId: string): Promise<Participant[]>;
  getSchedule(tournamentId: string): Promise<ScheduleResponse>;
  getBracket(tournamentId: string): Promise<BracketResponse>;
  getResults(tournamentId: string): Promise<ResultsResponse>;
  getAdminTournaments(): Promise<Tournament[]>;
  createTournament(payload: {
    title: string;
    description?: string;
    setsToWin?: number;
    tvIntervalSec?: number;
    roundsCount?: number;
    date?: string | null;
    isActive?: boolean;
  }): Promise<Tournament>;
  updateTournament(
    tournamentId: string,
    payload: Partial<{
      title: string;
      description: string;
      setsToWin: number;
      tvIntervalSec: number;
      roundsCount: number;
      date: string | null;
      isTelegramEnabled: boolean;
      isActive: boolean;
      status: TournamentStatus;
      confirmStatusChange: boolean;
      confirmResetResults: boolean;
    }>
  ): Promise<Tournament>;
  getAdminParticipants(tournamentId: string): Promise<Participant[]>;
  addParticipant(
    tournamentId: string,
    payload: { nickname: string; tribe: "comet" | "satellite" | "star"; telegramContact?: string | null }
  ): Promise<Participant>;
  importParticipantsCsv(tournamentId: string, csv: string): Promise<CsvImportResult>;
  editParticipant(
    participantId: string,
    payload: Partial<{
      nickname: string;
      tribe: "comet" | "satellite" | "star";
      telegramContact: string | null;
      status: "registered" | "seeded" | "active" | "eliminated" | "finished";
    }>
  ): Promise<Participant>;
  removeParticipant(participantId: string): Promise<void>;
  seedTournament(tournamentId: string): Promise<void>;
  getAdminMatches(tournamentId: string): Promise<MatchView[]>;
  generateNextRound(tournamentId: string): Promise<{ round: number }>;
  scheduleMatch(matchId: string, scheduledAt: string): Promise<MatchView>;
  scheduleMatchAuto(matchId: string): Promise<MatchView>;
  saveMatchResult(matchId: string, payload: { winnerId: string; scoreA: number; scoreB: number }): Promise<MatchView>;
  resetMatchResult(matchId: string): Promise<MatchView>;
  getAuditLog(tournamentId: string): Promise<AuditRecord[]>;
}

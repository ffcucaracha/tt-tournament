import {
  AuditRecord,
  BracketResponse,
  CsvImportResult,
  MatchView,
  Participant,
  PublicOverviewResponse,
  ResultsResponse,
  ScheduleResponse,
  Tournament
} from "../api/types";
import { mockAudit, mockMatches, mockParticipants, mockResults, mockTournament } from "../mocks/mockData";
import { TournamentRepository } from "./repository.types";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

let tournament = clone(mockTournament);
let participants = clone(mockParticipants);
let matches = clone(mockMatches);
let audit = clone(mockAudit);

export const mockRepository: TournamentRepository = {
  async getPublicOverview(): Promise<PublicOverviewResponse> {
    return {
      tournament: clone(tournament),
      participantsCount: participants.length,
      inProgressCount: 0,
      pendingCount: matches.filter((item) => item.status === "pending").length,
      finishedCount: matches.filter((item) => item.status === "finished" || item.status === "bye").length
    };
  },
  async getParticipants(): Promise<Participant[]> { return clone(participants); },
  async getSchedule(): Promise<ScheduleResponse> {
    return {
      finished: clone(matches.filter((item) => item.status === "finished" || item.status === "bye").slice(0, 5)),
      inProgress: [],
      pending: clone(matches.filter((item) => item.status === "pending").slice(0, 5))
    };
  },
  async getBracket(): Promise<BracketResponse> {
    const rounds = new Map<number, MatchView[]>();
    for (const match of matches) rounds.set(match.roundNumber, [...(rounds.get(match.roundNumber) ?? []), clone(match)]);
    return {
      rounds: [...rounds.entries()].map(([roundNumber, roundMatches]) => ({
        roundNumber,
        status: roundMatches.every((m) => m.status === "finished" || m.status === "bye") ? "finished" : "in_progress",
        matches: roundMatches
      }))
    };
  },
  async getResults(): Promise<ResultsResponse> { return clone(mockResults); },
  async getAdminTournaments(): Promise<Tournament[]> { return [clone(tournament)]; },
  async createTournament(payload): Promise<Tournament> {
    const now = new Date().toISOString();
    tournament = {
      id: `t${Date.now()}`,
      title: payload.title,
      description: payload.description ?? "",
      status: "draft",
      isActive: payload.isActive ?? true,
      format: "swiss",
      setsToWin: payload.setsToWin ?? 2,
      tvIntervalSec: payload.tvIntervalSec ?? 10,
      isTelegramEnabled: false,
      roundsCount: Math.min(10, Math.max(1, payload.roundsCount ?? 5)),
      currentRound: 0,
      date: payload.date ?? null,
      createdAt: now,
      updatedAt: now,
      startedAt: null,
      finishedAt: null
    };
    participants = [];
    matches = [];
    audit = [];
    return clone(tournament);
  },
  async updateTournament(_id, payload): Promise<Tournament> { tournament = { ...tournament, ...payload }; return clone(tournament); },
  async getAdminParticipants(): Promise<Participant[]> { return clone(participants); },
  async addParticipant(_id, payload): Promise<Participant> {
    if (tournament.status !== "draft") throw new Error("Participants can be added only while tournament is draft");
    const participant: Participant = { id: `p${participants.length + 1}`, tournamentId: tournament.id, nickname: payload.nickname, fullName: payload.fullName ?? null, tribe: payload.tribe, telegramContact: payload.telegramContact ?? null, registrationOrder: participants.length + 1, seedNumber: null, status: "registered", finalPlace: null, finalScore: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    participants.push(participant);
    return clone(participant);
  },
  async importParticipantsCsv(): Promise<CsvImportResult> { return { createdCount: 0, skippedCount: 0, created: [], skipped: [] }; },
  async editParticipant(participantId, payload): Promise<Participant> {
    const idx = participants.findIndex((p) => p.id === participantId);
    if (idx < 0) throw new Error("Participant not found");
    participants[idx] = { ...participants[idx], ...payload, updatedAt: new Date().toISOString() };
    return clone(participants[idx]);
  },
  async removeParticipant(participantId): Promise<void> { participants = participants.filter((p) => p.id !== participantId); },
  async seedTournament(): Promise<void> {
    if (participants.length < 10) throw new Error("Tournament requires at least 10 participants to start");
    tournament.status = "in_progress";
  },
  async getAdminMatches(): Promise<MatchView[]> { return clone(matches); },
  async generateNextRound(): Promise<{ round: number }> {
    tournament.currentRound += 1;
    return { round: tournament.currentRound };
  },
  async scheduleMatch(matchId, scheduledAt): Promise<MatchView> { const m = matches.find((x) => x.id === matchId); if (!m) throw new Error("Match not found"); m.scheduledAt = scheduledAt; return clone(m); },
  async scheduleMatchAuto(matchId): Promise<MatchView> { return this.scheduleMatch(matchId, new Date().toISOString()); },
  async saveMatchResult(matchId, payload): Promise<MatchView> { const m = matches.find((x) => x.id === matchId); if (!m) throw new Error("Match not found"); m.resultType = payload.resultType ?? "played"; m.winnerId = payload.winnerId ?? null; m.scoreA = payload.scoreA ?? 0; m.scoreB = payload.scoreB ?? 0; m.status = "finished"; return clone(m); },
  async resetMatchResult(matchId): Promise<MatchView> { const m = matches.find((x) => x.id === matchId); if (!m) throw new Error("Match not found"); m.winnerId = null; m.scoreA = null; m.scoreB = null; m.resultType = null; m.status = "pending"; return clone(m); },
  async getAuditLog(): Promise<AuditRecord[]> { return clone(audit); }
};

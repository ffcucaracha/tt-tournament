import { BracketType, MatchStatus, Participant, Prisma, RoundStatus, ScheduleSource, TournamentStatus } from "@prisma/client";
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { MatchResultType, MatchView } from "../types";
import { PrismaService } from "../prisma.service";
import { aggregateTribeStats, inferMatchResultType, MatchWithParticipants, toMatchView } from "./store.mappers";
import { SetResultInput, UpdateMatchInput } from "./store.types";
import { AuditRecordsService } from "./audit-records.service";

type Standing = {
  participantId: string;
  nickname: string;
  tribe: "comet" | "satellite" | "star";
  seedNumber: number | null;
  status: Participant["status"];
  wins: number;
  losses: number;
  byes: number;
  points: number;
  buchholz: number;
  games: number;
};

type PairingCandidate = Standing & { previousOpponentIds: string[] };

type RankedStanding = {
  participantId: string;
  nickname: string;
  tribe: "comet" | "satellite" | "star";
  place: number;
  placeLabel: string;
  rankScore: number;
  wins: number;
  losses: number;
  score: number;
  bye: number;
  buchholz: number;
  games: number;
  sortReason: string;
};

@Injectable()
export class MatchesStoreService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditRecords: AuditRecordsService
  ) {}

  async listMatches(tournamentId: string): Promise<MatchView[]> {
    const rows = await this.prisma.match.findMany({
      where: { tournamentId },
      include: { participantA: true, participantB: true },
      orderBy: [{ roundNumber: "asc" }, { matchNumber: "asc" }]
    });
    return rows.map((row) => toMatchView(row));
  }

  async listRounds(tournamentId: string): Promise<Array<Record<string, unknown>>> {
    const rounds = await this.prisma.round.findMany({ where: { tournamentId }, orderBy: { number: "asc" } });
    return rounds.map((r) => ({
      id: r.id,
      number: r.number,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
      startedAt: r.startedAt ? r.startedAt.toISOString() : null,
      completedAt: r.completedAt ? r.completedAt.toISOString() : null,
      scheduledAt: r.scheduledAt ? r.scheduledAt.toISOString() : null
    }));
  }

  async getRoundMatches(tournamentId: string, roundNumber: number): Promise<MatchView[]> {
    const rows = await this.prisma.match.findMany({
      where: { tournamentId, roundNumber },
      include: { participantA: true, participantB: true },
      orderBy: { matchNumber: "asc" }
    });
    return rows.map((row) => toMatchView(row));
  }

  async updateMatch(matchId: string, input: UpdateMatchInput): Promise<MatchView> {
    const match = await this.prisma.match.findUnique({ where: { id: matchId } });
    if (!match) throw new NotFoundException(`Match ${matchId} not found`);

    const data: Prisma.MatchUncheckedUpdateInput = {};

    if (input.scheduledAt !== undefined) {
      if (input.scheduledAt === null || input.scheduledAt === "") {
        data.scheduledAt = null;
        data.scheduleSource = null;
      } else {
        const parsed = new Date(input.scheduledAt);
        if (Number.isNaN(parsed.getTime())) {
          throw new BadRequestException("Invalid datetime");
        }
        data.scheduledAt = parsed;
        data.scheduleSource = ScheduleSource.manual;
      }
    }

    if (input.status !== undefined && input.status !== match.status) {
      if (input.status === MatchStatus.pending) {
        if (match.status === MatchStatus.bye) {
          throw new BadRequestException("Cannot change bye match status");
        }
        data.status = MatchStatus.pending;
        data.winnerId = null;
        data.loserId = null;
        data.scoreA = null;
        data.scoreB = null;
      } else {
        throw new BadRequestException("Only status reset to pending is allowed");
      }
    }

    if (Object.keys(data).length > 0) {
      await this.prisma.match.update({ where: { id: matchId }, data });
      await this.reopenRoundIfNeeded(match.roundId);
    }

    return this.getMatchView(matchId);
  }

  async scheduleMatch(matchId: string, scheduledAt: string, adminId: string | null): Promise<MatchView> {
    const match = await this.prisma.match.findUnique({ where: { id: matchId }, include: { participantA: true, participantB: true } });
    if (!match) throw new NotFoundException(`Match ${matchId} not found`);
    if (match.status === MatchStatus.bye) throw new BadRequestException("Cannot schedule a bye match");

    const parsed = new Date(scheduledAt);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException("Invalid datetime");
    }

    await this.prisma.match.update({
      where: { id: matchId },
      data: {
        scheduledAt: parsed,
        scheduleSource: ScheduleSource.manual
      }
    });
    const updated = await this.getMatchWithParticipants(matchId);
    await this.auditRecords.createAuditRecord({
      tournamentId: match.tournamentId,
      adminId,
      action: "match.schedule.manual",
      entityType: "match",
      entityId: matchId,
      beforeJson: this.toAuditMatchSnapshot(match),
      afterJson: this.toAuditMatchSnapshot(updated),
      metadataJson: { description: "Match scheduled manually" }
    });

    return toMatchView(updated);
  }

  async autoScheduleMatch(matchId: string, adminId: string | null): Promise<MatchView> {
    const match = await this.prisma.match.findUnique({ where: { id: matchId }, include: { participantA: true, participantB: true } });
    if (!match) throw new NotFoundException(`Match ${matchId} not found`);
    if (match.status === MatchStatus.bye) throw new BadRequestException("Cannot schedule a bye match");

    const scheduledAt = this.nextFridayAt1830Omsk();
    await this.prisma.match.update({
      where: { id: matchId },
      data: {
        scheduledAt,
        scheduleSource: ScheduleSource.auto
      }
    });
    const updated = await this.getMatchWithParticipants(matchId);
    await this.auditRecords.createAuditRecord({
      tournamentId: match.tournamentId,
      adminId,
      action: "match.schedule.auto",
      entityType: "match",
      entityId: matchId,
      beforeJson: this.toAuditMatchSnapshot(match),
      afterJson: this.toAuditMatchSnapshot(updated),
      metadataJson: { description: "Match scheduled automatically" }
    });

    return toMatchView(updated);
  }
  async resetMatchResult(matchId: string, adminId: string | null): Promise<MatchView> {
    const match = await this.prisma.match.findUnique({ where: { id: matchId }, include: { participantA: true, participantB: true } });
    if (!match) throw new NotFoundException(`Match ${matchId} not found`);
    if (match.status === MatchStatus.bye) throw new BadRequestException("Cannot reset bye result");

    const tournament = await this.prisma.tournament.findUnique({ where: { id: match.tournamentId } });
    if (!tournament) throw new NotFoundException("Tournament not found");
    if (tournament.status === TournamentStatus.finished) throw new BadRequestException("Tournament already finished");

    await this.prisma.match.update({
      where: { id: matchId },
      data: {
        winnerId: null,
        loserId: null,
        scoreA: null,
        scoreB: null,
        status: MatchStatus.pending
      }
    });
    await this.reopenRoundIfNeeded(match.roundId);
    const updated = await this.getMatchWithParticipants(matchId);
    await this.auditRecords.createAuditRecord({
      tournamentId: match.tournamentId,
      adminId,
      action: "match.result.reset",
      entityType: "match",
      entityId: matchId,
      beforeJson: this.toAuditMatchSnapshot(match),
      afterJson: this.toAuditMatchSnapshot(updated),
      metadataJson: { description: "Match result reset" }
    });
    return toMatchView(updated);
  }
  async softResetTournamentResults(tx: Prisma.TransactionClient, tournamentId: string): Promise<void> {
    await tx.match.deleteMany({ where: { tournamentId } });
    await tx.round.deleteMany({ where: { tournamentId } });
    await tx.participant.updateMany({
      where: { tournamentId },
      data: {
        finalPlace: null,
        finalScore: null,
        seedNumber: null,
        status: "registered"
      }
    });
    await tx.tournament.update({
      where: { id: tournamentId },
      data: {
        currentRound: 0
      }
    });
  }

  async setMatchResult(matchId: string, input: SetResultInput, adminId: string | null): Promise<MatchView> {
    const match = await this.prisma.match.findUnique({ where: { id: matchId }, include: { participantA: true, participantB: true } });
    if (!match) throw new NotFoundException(`Match ${matchId} not found`);
    if (match.status === MatchStatus.bye) throw new BadRequestException("Cannot edit bye result");
    if (!match.participantAId || !match.participantBId) throw new BadRequestException("Match participants are not resolved");

    const tournament = await this.prisma.tournament.findUnique({ where: { id: match.tournamentId } });
    if (!tournament) throw new NotFoundException("Tournament not found");
    if (tournament.status === TournamentStatus.finished) throw new BadRequestException("Tournament already finished");

    const resultType = input.resultType ?? "played";
    const result = this.resolveMatchResult(resultType, input, match);
    if (resultType === "played" && !match.scheduledAt) {
      throw new BadRequestException("Match time must be scheduled before saving result");
    }

    await this.prisma.match.update({
      where: { id: matchId },
      data: {
        winnerId: result.winnerId,
        loserId: result.loserId,
        scoreA: result.scoreA,
        scoreB: result.scoreB,
        status: MatchStatus.finished
      }
    });

    await this.syncRoundStatus(match.roundId);
    const updated = await this.getMatchWithParticipants(matchId);
    await this.auditRecords.createAuditRecord({
      tournamentId: match.tournamentId,
      adminId,
      action: match.status === MatchStatus.finished ? "match.result.update" : "match.result.create",
      entityType: "match",
      entityId: matchId,
      beforeJson: this.toAuditMatchSnapshot(match),
      afterJson: this.toAuditMatchSnapshot(updated),
      metadataJson: { description: "Match result saved", resultType }
    });
    return toMatchView(updated);
  }

  async getPublicSchedule(tournamentId: string): Promise<Record<string, unknown>> {
    const rows = await this.listMatches(tournamentId);
    const pending = rows.filter((m) => m.status === "pending");
    return {
      finished: rows.filter((m) => m.status === "finished" || m.status === "bye"),
      inProgress: pending.filter((m) => m.scheduledAt !== null),
      pending: pending.filter((m) => m.scheduledAt === null)
    };
  }

  async getPublicBracket(tournamentId: string): Promise<Record<string, unknown>> {
    const rounds = await this.listRounds(tournamentId);
    const mapped = await Promise.all(rounds.map(async (r) => ({
      roundNumber: r.number as number,
      status: r.status as string,
      startedAt: (r.startedAt as string | null) ?? null,
      completedAt: (r.completedAt as string | null) ?? null,
      scheduledAt: (r.scheduledAt as string | null) ?? null,
      matches: await this.getRoundMatches(tournamentId, r.number as number)
    })));
    return { rounds: mapped };
  }

  async getPublicResults(tournamentId: string): Promise<Record<string, unknown>> {
    const touranment = await this.prisma.tournament.findUnique({ where: { id: tournamentId } });
    const standings = await this.getStandings(tournamentId);
    const ranked = this.rankStandings(standings);

    return {
      completed: touranment?.status === TournamentStatus.finished,
      standings: ranked,
      tribeStats: aggregateTribeStats(ranked)
    };
  }

  async getPublicTribeStats(tournamentId: string): Promise<Record<string, unknown>> {
    const standings = await this.getStandings(tournamentId);
    const ranked = this.rankStandings(standings);
    return { items: aggregateTribeStats(ranked) };
  }

  async buildTelegramPreview(tournamentId: string): Promise<{ message: string }> {
    const t = await this.prisma.tournament.findUnique({ where: { id: tournamentId } });
    return { message: `Тур ${t?.currentRound ?? 0} из ${t?.roundsCount ?? 0}` };
  }

  async createNextRound(tournamentId: string): Promise<{ round: number }> {
    return this.prisma.$transaction((tx) => this.createNextRoundInTransaction(tx, tournamentId));
  }

  async createNextRoundInTransaction(tx: Prisma.TransactionClient, tournamentId: string): Promise<{ round: number }> {
    const tournament = await tx.tournament.findUnique({ where: { id: tournamentId } });
    if (!tournament) throw new NotFoundException("Tournament not found");
    if (tournament.status !== TournamentStatus.in_progress) throw new BadRequestException("Tournament is not in progress");
    if (tournament.currentRound >= tournament.roundsCount) throw new BadRequestException("Maximum rounds reached");

    if (tournament.currentRound > 0) {
      const prev = await tx.round.findFirst({ where: { tournamentId, number: tournament.currentRound } });
      if (!prev || prev.status !== RoundStatus.finished) throw new BadRequestException("Current round is not finished");
    }

    const participants = await tx.participant.findMany({ where: { tournamentId }, orderBy: { id: "asc" } });
    if (participants.length < 2) throw new BadRequestException("At least 2 participants required");

    const standings = await this.getStandings(tournamentId, tx);
    const pairingStandings = standings.filter((standing) => standing.status !== "eliminated");
    if (pairingStandings.length === 0) {
      throw new BadRequestException("No active participants available for pairing");
    }
    const nextRoundNumber = tournament.currentRound + 1;
    const history = await this.historyMap(tournamentId, tx);
    const pairs = this.makePairs(pairingStandings, history);

    const round = await tx.round.create({
      data: { tournamentId, number: nextRoundNumber, status: RoundStatus.in_progress, startedAt: new Date() }
    });
    let matchNumber = 1;
    for (const pair of pairs.matches) {
      await tx.match.create({
        data: {
          tournamentId,
          roundId: round.id,
          bracketType: BracketType.swiss,
          roundNumber: nextRoundNumber,
          matchNumber,
          sequence: nextRoundNumber * 100 + matchNumber,
          participantAId: pair[0],
          participantBId: pair[1],
          status: MatchStatus.pending
        }
      });
      matchNumber += 1;
    }

    if (pairs.byeParticipantId) {
      await tx.match.create({
        data: {
          tournamentId,
          roundId: round.id,
          bracketType: BracketType.swiss,
          roundNumber: nextRoundNumber,
          matchNumber,
          sequence: nextRoundNumber * 100 + matchNumber,
          participantAId: pairs.byeParticipantId,
          participantBId: null,
          winnerId: pairs.byeParticipantId,
          status: MatchStatus.bye,
          scoreA: 1,
          scoreB: 0
        }
      });
    }

    await tx.tournament.update({ where: { id: tournamentId }, data: { currentRound: nextRoundNumber } });
    return { round: nextRoundNumber };
  }

  private async getStandings(tournamentId: string, tx: Prisma.TransactionClient = this.prisma): Promise<Standing[]> {
    const participants = await tx.participant.findMany({ where: { tournamentId } });
    const finished = await tx.match.findMany({ where: { tournamentId, status: { in: [MatchStatus.finished, MatchStatus.bye] } } });

    const map = new Map<string, Standing>();
    for (const p of participants) {
      map.set(p.id, {
        participantId: p.id,
        nickname: p.nickname,
        tribe: p.tribe,
        seedNumber: p.seedNumber,
        status: p.status,
        wins: 0,
        losses: 0,
        byes: 0,
        points: 0,
        buchholz: 0,
        games: 0
      });
    }

    for (const m of finished) {
      if (!m.participantAId) continue;
      const a = map.get(m.participantAId);
      if (!a) continue;
      if (m.status === MatchStatus.bye) {
        a.byes += 1; a.points += 1; a.wins += 1; a.games += 1;
        continue;
      }
      if (!m.participantBId) continue;
      const b = map.get(m.participantBId);
      if (!b) continue;
      a.games += 1; b.games += 1;
      if (!m.winnerId) {
        a.losses += 1; b.losses += 1;
      } else if (m.winnerId === a.participantId) {
        a.wins += 1; a.points += 1; b.losses += 1;
      } else {
        b.wins += 1; b.points += 1; a.losses += 1;
      }
    }

    for (const m of finished) {
      if (m.status === MatchStatus.bye || !m.participantAId || !m.participantBId) continue;
      const a = map.get(m.participantAId);
      const b = map.get(m.participantBId);
      if (!a || !b) continue;
      a.buchholz += b.points;
      b.buchholz += a.points;
    }

    return [...map.values()].sort((a, b) =>
      b.points - a.points ||
      b.buchholz - a.buchholz ||
      b.wins - a.wins ||
      a.participantId.localeCompare(b.participantId)
    );
  }

  private rankStandings(standings: Standing[]): RankedStanding[] {
    const participantsTotal = standings.length;
    const ranked: RankedStanding[] = [];

    for (let index = 0; index < standings.length;) {
      const first = standings[index];
      let groupEnd = index + 1;
      while (groupEnd < standings.length && this.hasSameResult(first, standings[groupEnd])) {
        groupEnd += 1;
      }

      const placeStart = index + 1;
      const placeEnd = groupEnd;
      const placeLabel = placeStart === placeEnd ? `${placeStart}` : `${placeStart}-${placeEnd}`;
      const rankScore = this.averageRankScoreForPlaces(participantsTotal, placeStart, placeEnd);

      for (let groupIndex = index; groupIndex < groupEnd; groupIndex += 1) {
        const standing = standings[groupIndex];
        ranked.push({
          participantId: standing.participantId,
          nickname: standing.nickname,
          tribe: standing.tribe,
          place: placeStart,
          placeLabel,
          rankScore,
          wins: standing.wins,
          losses: standing.losses,
          score: standing.points,
          bye: standing.byes,
          buchholz: standing.buchholz,
          games: standing.games,
          sortReason: "points > buchholz > wins"
        });
      }

      index = groupEnd;
    }

    return ranked;
  }

  private hasSameResult(a: Standing, b: Standing): boolean {
    return a.points === b.points && a.buchholz === b.buchholz && a.wins === b.wins;
  }

  private averageRankScoreForPlaces(participantsTotal: number, placeStart: number, placeEnd: number): number {
    const count = placeEnd - placeStart + 1;
    let total = 0;
    for (let place = placeStart; place <= placeEnd; place += 1) {
      total += participantsTotal - place + 1;
    }
    return Number((total / count).toFixed(2));
  }

  private async historyMap(tournamentId: string, tx: Prisma.TransactionClient = this.prisma): Promise<Map<string, Set<string>>> {
    const map = new Map<string, Set<string>>();
    const matches = await tx.match.findMany({ where: { tournamentId, status: { in: [MatchStatus.finished, MatchStatus.bye, MatchStatus.pending] } } });
    for (const m of matches) {
      if (!m.participantAId) continue;
      if (!map.has(m.participantAId)) map.set(m.participantAId, new Set());
      if (m.participantBId) {
        if (!map.has(m.participantBId)) map.set(m.participantBId, new Set());
        map.get(m.participantAId)!.add(m.participantBId);
        map.get(m.participantBId)!.add(m.participantAId);
      }
    }
    return map;
  }

  private makePairs(standings: Standing[], history: Map<string, Set<string>>): { matches: Array<[string, string]>; byeParticipantId: string | null } {
    const participants = standings.map((s) => ({
      ...s,
      previousOpponentIds: [...(history.get(s.participantId) ?? [])]
    }));

    let byeParticipantId: string | null = null;
    if (participants.length % 2 !== 0) {
      const eligible = [...participants].reverse().find((p) => p.byes === 0) ?? participants[participants.length - 1];
      byeParticipantId = eligible.participantId;
      participants.splice(participants.findIndex((p) => p.participantId === eligible.participantId), 1);
    }

    const strict = this.backtrackPairs(participants, [], false);
    if (strict) return { matches: strict, byeParticipantId };
    const fallback = this.backtrackPairs(participants, [], true);
    if (!fallback) throw new BadRequestException("Unable to create round pairings");
    return { matches: fallback, byeParticipantId };
  }

  private backtrackPairs(
    participants: PairingCandidate[],
    acc: Array<[string, string]>,
    allowRematch: boolean
  ): Array<[string, string]> | null {
    if (participants.length === 0) return acc;
    const first = participants[0];
    const restPool = participants.slice(1);
    const candidates = restPool
      .map((p, idx) => ({ p, idx }))
      .sort((a, b) =>
        Math.abs(first.points - a.p.points) - Math.abs(first.points - b.p.points) ||
        (b.p.buchholz - a.p.buchholz) ||
        a.p.participantId.localeCompare(b.p.participantId)
      );

    for (const { p, idx } of candidates) {
      const isRematch = first.previousOpponentIds.includes(p.participantId);
      if (!allowRematch && isRematch) continue;
      const rest = restPool.filter((_, i) => i !== idx);
      const result = this.backtrackPairs(rest, [...acc, [first.participantId, p.participantId]], allowRematch);
      if (result) return result;
    }
    return null;
  }

  private async syncRoundStatus(roundId: string): Promise<void> {
    const total = await this.prisma.match.count({ where: { roundId } });
    const finished = await this.prisma.match.count({ where: { roundId, status: { in: [MatchStatus.finished, MatchStatus.bye] } } });
    if (total > 0 && total === finished) {
      await this.prisma.round.update({ where: { id: roundId }, data: { status: RoundStatus.finished, completedAt: new Date() } });
    }
  }

  private resolveMatchResult(
    resultType: MatchResultType,
    input: SetResultInput,
    match: MatchWithParticipants
  ): { winnerId: string | null; loserId: string | null; scoreA: number; scoreB: number } {
    if (!match.participantAId || !match.participantBId) {
      throw new BadRequestException("Match participants are not resolved");
    }

    if (resultType === "technical_loss_a") {
      return { winnerId: match.participantBId, loserId: match.participantAId, scoreA: 0, scoreB: 0 };
    }

    if (resultType === "technical_loss_b") {
      return { winnerId: match.participantAId, loserId: match.participantBId, scoreA: 0, scoreB: 0 };
    }

    if (resultType === "technical_loss_both") {
      return { winnerId: null, loserId: null, scoreA: 0, scoreB: 0 };
    }

    if (input.winnerId !== match.participantAId && input.winnerId !== match.participantBId) {
      throw new BadRequestException("Winner must be one of match participants");
    }
    const winnerId = input.winnerId;
    if (input.scoreA === undefined || input.scoreB === undefined) {
      throw new BadRequestException("Score is required");
    }
    if (input.scoreA === input.scoreB) {
      throw new BadRequestException("Score cannot be equal");
    }

    const scoreWinnerId = input.scoreA > input.scoreB ? match.participantAId : match.participantBId;
    if (winnerId !== scoreWinnerId) {
      throw new BadRequestException("Winner must match score");
    }

    return {
      winnerId,
      loserId: winnerId === match.participantAId ? match.participantBId : match.participantAId,
      scoreA: input.scoreA,
      scoreB: input.scoreB
    };
  }

  private async reopenRoundIfNeeded(roundId: string): Promise<void> {
    const pendingCount = await this.prisma.match.count({ where: { roundId, status: MatchStatus.pending } });
    if (pendingCount > 0) {
      await this.prisma.round.update({
        where: { id: roundId },
        data: {
          status: RoundStatus.in_progress,
          completedAt: null
        }
      });
    }
  }

  private nextFridayAt1830Omsk(from = new Date()): Date {
    const nowOmsk = new Date(from.toLocaleString("en-US", { timeZone: "Asia/Omsk" }));
    const day = nowOmsk.getDay(); // 0..6, Friday=5
    const daysToFriday = (5 - day + 7) % 7;
    const target = new Date(nowOmsk);
    target.setDate(nowOmsk.getDate() + daysToFriday);
    target.setHours(18, 30, 0, 0);

    if (daysToFriday === 0 && target.getTime() <= nowOmsk.getTime()) {
      target.setDate(target.getDate() + 7);
    }

    // Asia/Omsk is UTC+6 without DST.
    return new Date(target.getTime() - 6 * 60 * 60 * 1000);
  }

  private async getMatchView(matchId: string): Promise<MatchView> {
    const row = await this.prisma.match.findUnique({ where: { id: matchId }, include: { participantA: true, participantB: true } });
    if (!row) throw new NotFoundException(`Match ${matchId} not found`);
    return toMatchView(row);
  }

  private async getMatchWithParticipants(matchId: string): Promise<MatchWithParticipants> {
    const row = await this.prisma.match.findUnique({ where: { id: matchId }, include: { participantA: true, participantB: true } });
    if (!row) throw new NotFoundException(`Match ${matchId} not found`);
    return row;
  }

  private toAuditMatchSnapshot(match: MatchWithParticipants): Record<string, unknown> {
    const participantA = match.participantA
      ? { id: match.participantA.id, nickname: match.participantA.nickname, tribe: match.participantA.tribe }
      : null;
    const participantB = match.participantB
      ? { id: match.participantB.id, nickname: match.participantB.nickname, tribe: match.participantB.tribe }
      : null;
    const winner =
      match.winnerId === match.participantAId
        ? participantA
        : match.winnerId === match.participantBId
          ? participantB
          : null;

    return {
      roundNumber: match.roundNumber,
      matchNumber: match.matchNumber,
      participantA,
      participantB,
      winner,
      winnerId: match.winnerId,
      loserId: match.loserId,
      scoreA: match.scoreA,
      scoreB: match.scoreB,
      status: match.status,
      resultType: inferMatchResultType(match),
      scheduledAt: match.scheduledAt ? match.scheduledAt.toISOString() : null,
      scheduleSource: match.scheduleSource
    };
  }
}

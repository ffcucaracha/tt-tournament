import { Tournament, TournamentStatus, Prisma } from "@prisma/client";
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { serializeTournament } from "./store.mappers";
import { CreateTournamentInput, UpdateTournamentInput } from "./store.types";
import { MatchesStoreService } from "./matches-store.service";
import { getRecommendedSwissRounds } from "../swiss";

@Injectable()
export class TournamentsStoreService {
  private static readonly ACTIVE_TOURNAMENT_ALIAS = "active";

  constructor(
    private readonly prisma: PrismaService,
    private readonly matchesStore: MatchesStoreService
  ) {}

  async listTournaments(): Promise<Array<Record<string, unknown>>> {
    const rows = await this.prisma.tournament.findMany({
      orderBy: [{ isActive: "desc" }, { createdAt: "desc" }]
    });
    return rows.map((row) => serializeTournament(row));
  }

  async resolveTournamentId(tournamentId: string): Promise<string> {
    if (tournamentId !== TournamentsStoreService.ACTIVE_TOURNAMENT_ALIAS) {
      return tournamentId;
    }
    const active = await this.ensureActiveTournament();
    return active.id;
  }

  async getActiveTournament(): Promise<Tournament> {
    return this.ensureActiveTournament();
  }

  async getTournament(tournamentId: string): Promise<Tournament> {
    const resolvedTournamentId = await this.resolveTournamentId(tournamentId);
    const tournament = await this.prisma.tournament.findUnique({ where: { id: resolvedTournamentId } });
    if (!tournament) {
      throw new NotFoundException(`Tournament ${resolvedTournamentId} not found`);
    }
    return tournament;
  }

  async createTournament(input: CreateTournamentInput): Promise<Record<string, unknown>> {
    const hasActiveTournament = Boolean(await this.prisma.tournament.findFirst({ where: { isActive: true }, select: { id: true } }));
    const shouldBeActive = input.isActive === true || !hasActiveTournament;
    const created = await this.prisma.$transaction(async (tx) => {
      if (shouldBeActive) {
        await tx.tournament.updateMany({
          where: { isActive: true },
          data: { isActive: false }
        });
      }
      return tx.tournament.create({
        data: {
          id: input.id,
          title: input.title,
          description: input.description ?? "",
          status: TournamentStatus.draft,
          isActive: shouldBeActive,
          format: "swiss",
          roundsCount: input.roundsCount ?? getRecommendedSwissRounds(10),
          currentRound: 0,
          setsToWin: input.setsToWin ?? 2,
          tvIntervalSec: input.tvIntervalSec ?? 10,
          isTelegramEnabled: false,
          date: input.date ? new Date(input.date) : null,
          startedAt: null,
          finishedAt: null
        }
      });
    });
    return serializeTournament(created);
  }

  async updateTournament(tournamentId: string, input: UpdateTournamentInput): Promise<Record<string, unknown>> {
    const current = await this.getTournament(tournamentId);
    const targetTournamentId = current.id;
    if (input.isActive === false) {
      throw new BadRequestException("Active tournament can only be changed by activating another tournament");
    }
    const shouldActivate = input.isActive === true && !current.isActive;
    const requestedStatus = input.status;
    const statusChanged = requestedStatus !== undefined && requestedStatus !== current.status;
    if (input.roundsCount !== undefined && current.status !== TournamentStatus.draft && input.roundsCount !== current.roundsCount) {
      throw new BadRequestException("Round count cannot be changed after tournament start");
    }

    if (statusChanged) {
      if (!input.confirmStatusChange) {
        throw new BadRequestException("Status change requires confirmation");
      }
      if (current.status === TournamentStatus.draft) {
        throw new BadRequestException("Manual transition from draft is not allowed");
      }
      if (current.status === TournamentStatus.finished) {
        throw new BadRequestException("Finished tournament status cannot be changed");
      }
      if (current.status === TournamentStatus.in_progress && requestedStatus === TournamentStatus.draft && !input.confirmResetResults) {
        throw new BadRequestException("Reset to draft requires result reset confirmation");
      }
      if (
        current.status === TournamentStatus.in_progress &&
        requestedStatus !== TournamentStatus.draft &&
        requestedStatus !== TournamentStatus.finished
      ) {
        throw new BadRequestException("Only draft or finished are allowed from in_progress");
      }
    }

    const baseUpdate: Prisma.TournamentUpdateInput = {
      title: input.title,
      description: input.description,
      setsToWin: input.setsToWin,
      tvIntervalSec: input.tvIntervalSec,
      date: input.date !== undefined ? (input.date ? new Date(input.date) : null) : undefined,
      isTelegramEnabled: input.isTelegramEnabled,
      roundsCount: input.roundsCount,
      isActive: shouldActivate ? true : undefined,
      status: requestedStatus
    };

    let updated: Tournament;
    if (statusChanged && current.status === TournamentStatus.in_progress && requestedStatus === TournamentStatus.draft) {
      updated = await this.prisma.$transaction(async (tx) => {
        await this.matchesStore.softResetTournamentResults(tx, targetTournamentId);
        if (shouldActivate) {
          await tx.tournament.updateMany({
            where: {
              isActive: true,
              id: { not: targetTournamentId }
            },
            data: { isActive: false }
          });
        }
        return tx.tournament.update({
          where: { id: targetTournamentId },
          data: {
            ...baseUpdate,
            startedAt: null,
            finishedAt: null
          }
        });
      });
    } else if (shouldActivate) {
      updated = await this.prisma.$transaction(async (tx) => {
        await tx.tournament.updateMany({
          where: {
            isActive: true,
            id: { not: targetTournamentId }
          },
          data: { isActive: false }
        });
        return tx.tournament.update({
          where: { id: targetTournamentId },
          data: {
            ...baseUpdate,
            finishedAt: statusChanged && requestedStatus === TournamentStatus.finished
              ? new Date()
              : undefined
          }
        });
      });
    } else {
      updated = await this.prisma.tournament.update({
        where: { id: targetTournamentId },
        data: {
          ...baseUpdate,
          finishedAt: statusChanged && requestedStatus === TournamentStatus.finished
            ? new Date()
            : undefined
        }
      });
    }
    return serializeTournament(updated);
  }

  async deleteTournament(tournamentId: string): Promise<void> {
    const tournament = await this.getTournament(tournamentId);
    if (tournament.isActive) {
      throw new BadRequestException("Active tournament cannot be deleted. Activate another tournament first.");
    }
    await this.prisma.tournament.delete({ where: { id: tournament.id } });
  }

  async getPublicOverview(tournamentId: string): Promise<Record<string, unknown>> {
    const resolvedTournamentId = await this.resolveTournamentId(tournamentId);
    const tournament = await this.getTournament(resolvedTournamentId);
    const [participantsCount, inProgressCount, pendingCount, finishedCount] = await Promise.all([
      this.prisma.participant.count({ where: { tournamentId: resolvedTournamentId } }),
      this.prisma.match.count({
        where: { tournamentId: resolvedTournamentId, status: "pending", scheduledAt: { not: null } }
      }),
      this.prisma.match.count({ where: { tournamentId: resolvedTournamentId, status: "pending" } }),
      this.prisma.match.count({ where: { tournamentId: resolvedTournamentId, status: { in: ["finished", "bye"] } } })
    ]);

    return {
      tournament: serializeTournament(tournament),
      participantsCount,
      inProgressCount,
      pendingCount,
      finishedCount
    };
  }

  private async ensureActiveTournament(): Promise<Tournament> {
    const active = await this.prisma.tournament.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" }
    });
    if (active) {
      return active;
    }

    const fallback = await this.prisma.tournament.findFirst({
      orderBy: { createdAt: "desc" }
    });
    if (!fallback) {
      throw new NotFoundException("No tournaments found");
    }

    return this.prisma.tournament.update({
      where: { id: fallback.id },
      data: { isActive: true }
    });
  }
}

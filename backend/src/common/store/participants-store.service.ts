import { ParticipantStatus, TournamentStatus } from "@prisma/client";
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { serializeParticipant } from "./store.mappers";
import { CreateParticipantInput, UpdateParticipantInput } from "./store.types";
import { TournamentsStoreService } from "./tournaments-store.service";
import { MatchesStoreService } from "./matches-store.service";
import { isStartParticipantCountValid } from "../swiss";
import { shuffle } from "../utils";

@Injectable()
export class ParticipantsStoreService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tournamentsStore: TournamentsStoreService,
    private readonly matchesStore: MatchesStoreService
  ) {}

  async listParticipants(tournamentId: string): Promise<Array<Record<string, unknown>>> {
    await this.tournamentsStore.getTournament(tournamentId);
    const rows = await this.prisma.participant.findMany({ where: { tournamentId }, orderBy: { registrationOrder: "asc" } });
    return rows.map((row) => serializeParticipant(row));
  }

  async createParticipant(tournamentId: string, input: CreateParticipantInput): Promise<Record<string, unknown>> {
    const tournament = await this.tournamentsStore.getTournament(tournamentId);
    if (tournament.status !== TournamentStatus.draft) {
      throw new BadRequestException("Participants can be added only when tournament status is draft");
    }
    const existingCount = await this.prisma.participant.count({ where: { tournamentId } });
    if (existingCount >= 30) {
      throw new BadRequestException("Tournament cannot contain more than 30 participants");
    }
    const created = await this.prisma.participant.create({
      data: {
        tournamentId,
        nickname: input.nickname,
        tribe: input.tribe,
        telegramContact: input.telegramContact ?? null,
        registrationOrder: existingCount + 1,
        status: ParticipantStatus.registered
      }
    });
    return serializeParticipant(created);
  }

  async updateParticipant(participantId: string, input: UpdateParticipantInput): Promise<Record<string, unknown>> {
    const existing = await this.prisma.participant.findUnique({ where: { id: participantId } });
    if (!existing) throw new NotFoundException(`Participant ${participantId} not found`);
    const updated = await this.prisma.participant.update({ where: { id: participantId }, data: input });
    return serializeParticipant(updated);
  }

  async deleteParticipant(participantId: string): Promise<void> {
    const existing = await this.prisma.participant.findUnique({ where: { id: participantId } });
    if (!existing) throw new NotFoundException(`Participant ${participantId} not found`);
    const tournament = await this.tournamentsStore.getTournament(existing.tournamentId);
    if (tournament.status !== TournamentStatus.draft) {
      throw new BadRequestException("Participants can be deleted only when tournament status is draft");
    }
    await this.prisma.participant.delete({ where: { id: participantId } });
  }

  async getPublicParticipants(tournamentId: string): Promise<Record<string, unknown>> {
    await this.tournamentsStore.getTournament(tournamentId);
    const rows = await this.prisma.participant.findMany({ where: { tournamentId }, orderBy: [{ registrationOrder: "asc" }] });
    return { items: rows.map((row) => serializeParticipant(row)) };
  }

  async seedTournament(tournamentId: string, _adminId: string | null): Promise<{ seeded: Array<Record<string, unknown>> }> {
    const seeded = await this.prisma.$transaction(async (tx) => {
      const tournament = await tx.tournament.findUnique({ where: { id: tournamentId } });
      if (!tournament) {
        throw new NotFoundException(`Tournament ${tournamentId} not found`);
      }
      if (tournament.status !== TournamentStatus.draft) {
        throw new BadRequestException("Start is only available when tournament status is draft");
      }

      const scoped = await tx.participant.findMany({ where: { tournamentId }, orderBy: { registrationOrder: "asc" } });
      if (!isStartParticipantCountValid(scoped.length)) {
        if (scoped.length < 10) throw new BadRequestException("Tournament requires at least 10 participants to start");
        throw new BadRequestException("Tournament cannot contain more than 30 participants");
      }

      await tx.participant.updateMany({
        where: { tournamentId },
        data: {
          seedNumber: null,
          status: ParticipantStatus.registered
        }
      });

      const seededParticipants = shuffle(scoped);
      for (let index = 0; index < seededParticipants.length; index += 1) {
        await tx.participant.update({
          where: { id: seededParticipants[index].id },
          data: {
            seedNumber: index + 1,
            status: ParticipantStatus.seeded
          }
        });
      }

      await tx.tournament.update({
        where: { id: tournamentId },
        data: { status: TournamentStatus.in_progress, startedAt: new Date() }
      });
      await this.matchesStore.createNextRoundInTransaction(tx, tournamentId);

      return tx.participant.findMany({ where: { tournamentId }, orderBy: { registrationOrder: "asc" } });
    });

    return { seeded: seeded.map((item) => serializeParticipant(item)) };
  }
}

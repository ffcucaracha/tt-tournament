import { AuditAction as PrismaAuditAction, AuditEntityType, Prisma } from "@prisma/client";
import { BadRequestException, Injectable } from "@nestjs/common";
import { AuditAction as ApiAuditAction, AuditRecord } from "../types";
import { PrismaService } from "../prisma.service";

const API_TO_PRISMA_AUDIT_ACTION: Record<ApiAuditAction, PrismaAuditAction> = {
  "tournament.seed": PrismaAuditAction.tournament_seed,
  "tournament.reseed": PrismaAuditAction.tournament_reseed,
  "match.result.create": PrismaAuditAction.match_result_create,
  "match.result.update": PrismaAuditAction.match_result_update,
  "match.result.reset": PrismaAuditAction.match_result_reset,
  "match.schedule.manual": PrismaAuditAction.match_schedule_manual,
  "match.schedule.auto": PrismaAuditAction.match_schedule_auto
};

const PRISMA_TO_API_AUDIT_ACTION: Record<PrismaAuditAction, ApiAuditAction> = {
  [PrismaAuditAction.tournament_seed]: "tournament.seed",
  [PrismaAuditAction.tournament_reseed]: "tournament.reseed",
  [PrismaAuditAction.match_result_create]: "match.result.create",
  [PrismaAuditAction.match_result_update]: "match.result.update",
  [PrismaAuditAction.match_result_reset]: "match.result.reset",
  [PrismaAuditAction.match_schedule_manual]: "match.schedule.manual",
  [PrismaAuditAction.match_schedule_auto]: "match.schedule.auto"
};

@Injectable()
export class AuditRecordsService {
  constructor(private readonly prisma: PrismaService) {}

  async listAuditRecords(tournamentId: string): Promise<AuditRecord[]> {
    const rows = await this.prisma.auditRecord.findMany({
      where: { tournamentId },
      orderBy: { createdAt: "desc" }
    });
    return rows.map((row) => ({
      id: row.id,
      tournamentId: row.tournamentId,
      adminId: row.adminId,
      action: PRISMA_TO_API_AUDIT_ACTION[row.action],
      entityType: row.entityType,
      entityId: row.entityId,
      beforeJson: (row.beforeJson as Record<string, unknown> | null) ?? null,
      afterJson: (row.afterJson as Record<string, unknown> | null) ?? null,
      metadataJson: (row.metadataJson as Record<string, unknown> | null) ?? null,
      createdAt: row.createdAt.toISOString()
    }));
  }

  async createAuditRecord(input: {
    tournamentId: string;
    adminId: string | null;
    action: ApiAuditAction;
    entityType: "tournament" | "match" | "participant";
    entityId: string | null;
    beforeJson: Record<string, unknown> | null;
    afterJson: Record<string, unknown> | null;
    metadataJson: Record<string, unknown> | null;
  }): Promise<void> {
    const prismaAction = API_TO_PRISMA_AUDIT_ACTION[input.action];
    if (!prismaAction) {
      throw new BadRequestException(`Unknown audit action: ${input.action}`);
    }
    await this.prisma.auditRecord.create({
      data: {
        tournamentId: input.tournamentId,
        adminId: input.adminId,
        action: prismaAction,
        entityType: input.entityType as AuditEntityType,
        entityId: input.entityId,
        beforeJson: this.toNullableJsonInput(input.beforeJson),
        afterJson: this.toNullableJsonInput(input.afterJson),
        metadataJson: this.toNullableJsonInput(input.metadataJson)
      }
    });
  }

  private toNullableJsonInput(
    value: Record<string, unknown> | null
  ): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput {
    return value === null ? Prisma.DbNull : (value as Prisma.InputJsonValue);
  }
}

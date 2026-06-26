import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { IsIn, IsOptional, IsString } from "class-validator";
import { AdminAuthGuard } from "../auth/admin-auth.guard";
import { ParticipantsService } from "./participants.service";

class CreateParticipantDto {
  @IsString()
  nickname!: string;

  @IsIn(["comet", "satellite", "star"])
  tribe!: "comet" | "satellite" | "star";

  @IsOptional()
  @IsString()
  telegramContact?: string | null;
}

class UpdateParticipantDto {
  @IsOptional()
  @IsString()
  nickname?: string;

  @IsOptional()
  @IsIn(["comet", "satellite", "star"])
  tribe?: "comet" | "satellite" | "star";

  @IsOptional()
  @IsString()
  telegramContact?: string | null;

  @IsOptional()
  @IsIn(["registered", "seeded", "active", "eliminated", "finished"])
  status?: "registered" | "seeded" | "active" | "eliminated" | "finished";
}

class ImportCsvDto {
  @IsString()
  csv!: string;
}

@Controller("admin")
@UseGuards(AdminAuthGuard)
export class ParticipantsController {
  constructor(private readonly participantsService: ParticipantsService) {}

  @Get("tournaments/:id/participants")
  list(@Param("id") tournamentId: string): Promise<Record<string, unknown>> {
    return this.participantsService.list(tournamentId);
  }

  @Post("tournaments/:id/participants")
  create(@Param("id") tournamentId: string, @Body() body: CreateParticipantDto): Promise<Record<string, unknown>> {
    return this.participantsService.create(tournamentId, body);
  }

  @Patch("participants/:participantId")
  patch(
    @Param("participantId") participantId: string,
    @Body() body: UpdateParticipantDto
  ): Promise<Record<string, unknown>> {
    return this.participantsService.update(participantId, body);
  }

  @Delete("participants/:participantId")
  remove(@Param("participantId") participantId: string): Promise<Record<string, unknown>> {
    return this.participantsService.remove(participantId);
  }

  @Post("tournaments/:id/participants/import-csv")
  importCsv(@Param("id") tournamentId: string, @Body() body: ImportCsvDto): Promise<Record<string, unknown>> {
    return this.participantsService.importCsv(tournamentId, body);
  }

  @Post("tournaments/:id/seed")
  seed(
    @Param("id") tournamentId: string,
    @Req() request: { admin?: { id: string } }
  ): Promise<Record<string, unknown>> {
    return this.participantsService.seed(tournamentId, request.admin?.id ?? null);
  }
}

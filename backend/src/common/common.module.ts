import { Global, Module } from "@nestjs/common";
import { DataStoreService } from "./data-store.service";
import { PrismaService } from "./prisma.service";
import { AuditRecordsService } from "./store/audit-records.service";
import { MatchesStoreService } from "./store/matches-store.service";
import { ParticipantsStoreService } from "./store/participants-store.service";
import { TournamentsStoreService } from "./store/tournaments-store.service";

@Global()
@Module({
  providers: [
    PrismaService,
    AuditRecordsService,
    MatchesStoreService,
    TournamentsStoreService,
    ParticipantsStoreService,
    DataStoreService
  ],
  exports: [
    PrismaService,
    AuditRecordsService,
    MatchesStoreService,
    TournamentsStoreService,
    ParticipantsStoreService,
    DataStoreService
  ]
})
export class CommonModule {}

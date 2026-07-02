import { Injectable } from "@nestjs/common";
import { DataStoreService } from "../common/data-store.service";

type TribeCode = "comet" | "satellite" | "star";

interface CsvImportSkippedRow {
  row: number;
  raw: string;
  reason: string;
}

interface CsvImportResult {
  [key: string]: unknown;
  createdCount: number;
  skippedCount: number;
  created: Array<Record<string, unknown>>;
  skipped: CsvImportSkippedRow[];
}

type CsvColumn = "nickname" | "fullName" | "tribe" | "telegramContact";

const SUPPORTED_TRIBES: TribeCode[] = ["comet", "satellite", "star"];

const TRIBE_ALIASES: Record<string, TribeCode> = {
  comet: "comet",
  комета: "comet",
  satellite: "satellite",
  спутник: "satellite",
  star: "star",
  звезда: "star"
};

const CSV_HEADER_ALIASES: Record<CsvColumn, string[]> = {
  nickname: ["nickname", "nick", "platform nickname", "platform nick", "player", "participant", "ник", "никнейм", "никнейм участника", "ник на платформе"],
  fullName: ["full name", "real name", "name", "имя", "полное имя", "фио", "имя участника"],
  tribe: ["tribe", "team", "group", "трайб", "траиб", "команда", "группа"],
  telegramContact: ["telegram", "telegram contact", "telegram username", "tg", "телеграм", "telegramm"]
};

function normalizeText(value: string): string {
  return value
    .replace(/\uFEFF/g, "")
    .replace(/ё/g, "е")
    .toLowerCase()
    .replace(/[^a-z0-9а-я\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeCsvCell(value: string | undefined): string {
  return (value ?? "").trim();
}

function isEmptyRow(row: string[]): boolean {
  return row.every((cell) => normalizeCsvCell(cell).length === 0);
}

function detectDelimiter(csv: string): "," | ";" {
  const firstLine = csv
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.length > 0);
  if (!firstLine) {
    return ",";
  }

  let commaCount = 0;
  let semicolonCount = 0;
  let inQuotes = false;
  for (let index = 0; index < firstLine.length; index += 1) {
    const char = firstLine[index];
    if (char === '"') {
      if (inQuotes && firstLine[index + 1] === '"') {
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (inQuotes) {
      continue;
    }
    if (char === ",") {
      commaCount += 1;
    } else if (char === ";") {
      semicolonCount += 1;
    }
  }
  return semicolonCount > commaCount ? ";" : ",";
}

function parseCsvRows(csv: string, delimiter: "," | ";"): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let inQuotes = false;

  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index];
    if (inQuotes) {
      if (char === '"') {
        if (csv[index + 1] === '"') {
          currentField += '"';
          index += 1;
        } else {
          inQuotes = false;
        }
      } else {
        currentField += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }

    if (char === delimiter) {
      currentRow.push(currentField);
      currentField = "";
      continue;
    }

    if (char === "\n") {
      currentRow.push(currentField);
      rows.push(currentRow);
      currentRow = [];
      currentField = "";
      continue;
    }

    if (char === "\r") {
      continue;
    }

    currentField += char;
  }

  currentRow.push(currentField);
  rows.push(currentRow);
  return rows;
}

function resolveTribeCode(rawTribe: string): TribeCode | null {
  const normalized = normalizeText(rawTribe);
  if (!normalized) {
    return null;
  }
  return TRIBE_ALIASES[normalized] ?? null;
}

function looksLikeTimestamp(value: string): boolean {
  const normalized = normalizeCsvCell(value);
  if (!normalized) {
    return false;
  }
  return /\d{1,4}[./:-]\d{1,2}[./:-]\d{1,4}/.test(normalized) || !Number.isNaN(Date.parse(normalized));
}

function isHeaderCellMatch(headerCell: string, alias: string): boolean {
  const normalizedHeader = normalizeText(headerCell);
  const normalizedAlias = normalizeText(alias);
  if (!normalizedHeader || !normalizedAlias) {
    return false;
  }
  if (normalizedHeader === normalizedAlias) {
    return true;
  }

  const headerTokens = new Set(normalizedHeader.split(" ").filter(Boolean));
  const aliasTokens = normalizedAlias.split(" ").filter(Boolean);
  return aliasTokens.every((token) => headerTokens.has(token));
}

function resolveHeaderMap(headerRow: string[]): Partial<Record<CsvColumn, number>> {
  const map: Partial<Record<CsvColumn, number>> = {};
  for (let index = 0; index < headerRow.length; index += 1) {
    const cell = headerRow[index];
    for (const column of Object.keys(CSV_HEADER_ALIASES) as CsvColumn[]) {
      if (map[column] !== undefined) {
        continue;
      }
      if (CSV_HEADER_ALIASES[column].some((alias) => isHeaderCellMatch(cell, alias))) {
        map[column] = index;
      }
    }
  }
  return map;
}

function resolveCsvIndexes(rows: string[][], hasHeader: boolean, headerMap: Partial<Record<CsvColumn, number>>): Record<CsvColumn, number> {
  const defaultIndexes: Record<CsvColumn, number> = {
    nickname: headerMap.nickname ?? 0,
    fullName: headerMap.fullName ?? (hasHeader ? -1 : 1),
    tribe: headerMap.tribe ?? 2,
    telegramContact: headerMap.telegramContact ?? 3
  };

  if (hasHeader) {
    return defaultIndexes;
  }

  const firstDataRow = rows[0] ?? [];
  const defaultTribe = resolveTribeCode(normalizeCsvCell(firstDataRow[defaultIndexes.tribe]));
  const legacyGoogleFormsTribe = resolveTribeCode(normalizeCsvCell(firstDataRow[2]));
  if (legacyGoogleFormsTribe && looksLikeTimestamp(firstDataRow[0]) && firstDataRow.length >= 4) {
    return {
      nickname: 1,
      fullName: -1,
      tribe: 2,
      telegramContact: 3
    };
  }

  const legacyTribe = resolveTribeCode(normalizeCsvCell(firstDataRow[1]));
  if (!defaultTribe && legacyTribe && firstDataRow.length >= 3) {
    return {
      nickname: 0,
      fullName: -1,
      tribe: 1,
      telegramContact: 2
    };
  }

  const googleFormsTribe = resolveTribeCode(normalizeCsvCell(firstDataRow[3]));
  if (!defaultTribe && googleFormsTribe && firstDataRow.length >= 5) {
    return {
      nickname: 1,
      fullName: 2,
      tribe: 3,
      telegramContact: 4
    };
  }

  return defaultIndexes;
}

@Injectable()
export class ParticipantsService {
  constructor(private readonly store: DataStoreService) {}

  async list(tournamentId: string): Promise<Record<string, unknown>> {
    return { items: await this.store.listParticipants(tournamentId) };
  }

  create(
    tournamentId: string,
    input: {
      nickname: string;
      fullName?: string | null;
      tribe: TribeCode;
      telegramContact?: string | null;
    }
  ): Promise<Record<string, unknown>> {
    return this.store.createParticipant(tournamentId, input);
  }

  update(
    participantId: string,
    input: {
      nickname?: string;
      fullName?: string | null;
      tribe?: TribeCode;
      telegramContact?: string | null;
      status?: "registered" | "seeded" | "active" | "eliminated" | "finished";
    }
  ): Promise<Record<string, unknown>> {
    return this.store.updateParticipant(participantId, input);
  }

  async remove(participantId: string): Promise<Record<string, boolean>> {
    await this.store.deleteParticipant(participantId);
    return { ok: true };
  }

  seed(tournamentId: string, adminId: string | null): Promise<Record<string, unknown>> {
    return this.store.seedTournament(tournamentId, adminId);
  }

  async importCsv(
    tournamentId: string,
    input: { csv: string }
  ): Promise<Record<string, unknown>> {
    const delimiter = detectDelimiter(input.csv);
    const parsedRows = parseCsvRows(input.csv, delimiter).map((row) => row.map((cell) => normalizeCsvCell(cell)));
    const rows = parsedRows.filter((row) => !isEmptyRow(row));

    if (rows.length === 0) {
      const result: CsvImportResult = {
        createdCount: 0,
        skippedCount: 0,
        created: [],
        skipped: []
      };
      return result;
    }

    const headerMap = resolveHeaderMap(rows[0]);
    const hasHeader = headerMap.nickname !== undefined && headerMap.tribe !== undefined;
    const indexes = resolveCsvIndexes(rows, hasHeader, headerMap);
    const startIndex = hasHeader ? 1 : 0;

    const created: Array<Record<string, unknown>> = [];
    const skipped: CsvImportSkippedRow[] = [];
    for (let rowIndex = startIndex; rowIndex < rows.length; rowIndex += 1) {
      const row = rows[rowIndex];
      const nickname = normalizeCsvCell(row[indexes.nickname]);
      const fullName = normalizeCsvCell(row[indexes.fullName]) || null;
      const tribe = resolveTribeCode(normalizeCsvCell(row[indexes.tribe]));
      const telegramContact = normalizeCsvCell(row[indexes.telegramContact]) || null;

      if (!nickname) {
        skipped.push({
          row: rowIndex + 1,
          raw: row.join(delimiter),
          reason: "nickname is empty"
        });
        continue;
      }

      if (!tribe || !SUPPORTED_TRIBES.includes(tribe)) {
        skipped.push({
          row: rowIndex + 1,
          raw: row.join(delimiter),
          reason: "tribe is invalid"
        });
        continue;
      }

      try {
        created.push(
          await this.store.createParticipant(tournamentId, {
            nickname,
            fullName,
            tribe,
            telegramContact
          })
        );
      } catch (error) {
        const reason =
          error instanceof Error
            ? error.message
            : "failed to create participant";
        skipped.push({
          row: rowIndex + 1,
          raw: row.join(delimiter),
          reason
        });
      }
    }

    const result: CsvImportResult = {
      createdCount: created.length,
      skippedCount: skipped.length,
      created,
      skipped
    };
    return result;
  }
}

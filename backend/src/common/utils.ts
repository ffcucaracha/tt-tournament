export function nowIso(): string {
  return new Date().toISOString();
}

const OMSK_OFFSET_MINUTES = 6 * 60;
const OMSK_OFFSET_MS = OMSK_OFFSET_MINUTES * 60_000;
const OMSK_OFFSET_SUFFIX = "+06:00";

function toOmskPseudoUtc(date: Date): Date {
  return new Date(date.getTime() + OMSK_OFFSET_MS);
}

function fromOmskPseudoUtc(date: Date): Date {
  return new Date(date.getTime() - OMSK_OFFSET_MS);
}

function hasExplicitTimezone(value: string): boolean {
  return /(?:[zZ]|[+\-]\d{2}:\d{2})$/.test(value);
}

export function parseDateTimeInputToUtcDate(value: string): Date | null {
  const normalized = value.trim();
  if (!normalized) {
    return null;
  }

  let parsed: Date;
  if (hasExplicitTimezone(normalized)) {
    parsed = new Date(normalized);
  } else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(normalized)) {
    parsed = new Date(`${normalized}:00${OMSK_OFFSET_SUFFIX}`);
  } else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(normalized)) {
    parsed = new Date(`${normalized}${OMSK_OFFSET_SUFFIX}`);
  } else {
    parsed = new Date(normalized);
  }

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function nextFriday1830Iso(baseDate = new Date()): string {
  const omskNow = toOmskPseudoUtc(baseDate);
  const day = omskNow.getUTCDay();
  const friday = 5;
  let diff = friday - day;
  if (
    diff < 0 ||
    (diff === 0 && (omskNow.getUTCHours() > 18 || (omskNow.getUTCHours() === 18 && omskNow.getUTCMinutes() >= 30)))
  ) {
    diff += 7;
  }

  const targetOmsk = new Date(
    Date.UTC(
      omskNow.getUTCFullYear(),
      omskNow.getUTCMonth(),
      omskNow.getUTCDate() + diff,
      18,
      30,
      0,
      0
    )
  );

  return fromOmskPseudoUtc(targetOmsk).toISOString();
}

export function deepCopy<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

import { AuditRecord, MatchView, Participant, ResultsResponse, Tournament } from "../api/types";

export const MOCK_TOURNAMENT_ID = "tournament-demo";

export const mockTournament: Tournament = {
  id: MOCK_TOURNAMENT_ID,
  title: "Ping Pong Ping • Омск",
  description: "Любительский турнир по настольному теннису",
  status: "in_progress",
  isActive: true,
  format: "swiss",
  setsToWin: 2,
  tvIntervalSec: 10,
  isTelegramEnabled: true,
  roundsCount: 6,
  currentRound: 2,
  date: "2026-05-16",
  createdAt: "2026-05-10T09:00:00.000Z",
  startedAt: "2026-05-10T12:00:00.000Z",
  finishedAt: null
};

export const mockParticipants: Participant[] = [
  ["p1", "alex", "comet"],
  ["p2", "maria", "star"],
  ["p3", "nick", "satellite"],
  ["p4", "den", "comet"],
  ["p5", "anna", "star"],
  ["p6", "kirill", "satellite"],
  ["p7", "oleg", "comet"],
  ["p8", "max", "satellite"],
  ["p9", "lena", "star"],
  ["p10", "roma", "comet"],
  ["p11", "igor", "satellite"],
  ["p12", "zhenya", "star"],
  ["p13", "mike", "comet"],
  ["p14", "nina", "satellite"],
  ["p15", "rita", "star"],
  ["p16", "pavel", "comet"],
  ["p17", "sergey", "satellite"],
  ["p18", "sveta", "star"],
  ["p19", "tim", "comet"],
  ["p20", "yana", "satellite"]
].map((row, index) => ({
  id: row[0],
  tournamentId: MOCK_TOURNAMENT_ID,
  nickname: row[1],
  fullName: `${row[1][0].toUpperCase()}${row[1].slice(1)}`,
  tribe: row[2] as "comet" | "satellite" | "star",
  telegramContact: `@${row[1]}`,
  registrationOrder: index + 1,
  seedNumber: index + 1,
  status: "active",
  finalPlace: null,
  finalScore: null,
  createdAt: "2026-05-10T09:00:00.000Z",
  updatedAt: "2026-05-10T09:00:00.000Z"
}));

function player(id: string): MatchView["participantA"] {
  const participant = mockParticipants.find((item) => item.id === id);
  return participant ? { id: participant.id, nickname: participant.nickname, tribe: participant.tribe } : null;
}

export const mockMatches: MatchView[] = [
  { id: "m1", bracketType: "swiss", roundNumber: 1, matchNumber: 1, participantA: player("p1"), participantB: player("p2"), winnerId: "p1", scoreA: 2, scoreB: 0, status: "finished", resultType: "played", scheduledAt: "2026-05-15T10:00:00.000Z", scheduleSource: "manual" },
  { id: "m2", bracketType: "swiss", roundNumber: 1, matchNumber: 2, participantA: player("p3"), participantB: player("p4"), winnerId: "p4", scoreA: 1, scoreB: 2, status: "finished", resultType: "played", scheduledAt: "2026-05-15T12:00:00.000Z", scheduleSource: "manual" },
  { id: "m3", bracketType: "swiss", roundNumber: 1, matchNumber: 3, participantA: player("p5"), participantB: player("p6"), winnerId: "p5", scoreA: 2, scoreB: 1, status: "finished", resultType: "played", scheduledAt: "2026-05-15T13:00:00.000Z", scheduleSource: "manual" },
  { id: "m4", bracketType: "swiss", roundNumber: 1, matchNumber: 4, participantA: player("p7"), participantB: null, winnerId: "p7", scoreA: 1, scoreB: 0, status: "bye", resultType: null, scheduledAt: null, scheduleSource: null },
  { id: "m5", bracketType: "swiss", roundNumber: 2, matchNumber: 1, participantA: player("p1"), participantB: player("p4"), winnerId: "p1", scoreA: 2, scoreB: 1, status: "finished", resultType: "played", scheduledAt: "2026-05-16T10:00:00.000Z", scheduleSource: "manual" },
  { id: "m6", bracketType: "swiss", roundNumber: 2, matchNumber: 2, participantA: player("p5"), participantB: player("p7"), winnerId: "p5", scoreA: 2, scoreB: 0, status: "finished", resultType: "played", scheduledAt: "2026-05-16T12:00:00.000Z", scheduleSource: "manual" }
];

export const mockResults: ResultsResponse = {
  completed: false,
  standings: mockParticipants.slice(0, 6).map((participant, index) => ({
    participantId: participant.id,
    nickname: participant.nickname,
    tribe: participant.tribe,
    place: index + 1,
    rankScore: 6 - index,
    wins: Math.max(0, 3 - index),
    losses: index > 2 ? 2 : 1,
    score: Math.max(0, 3 - index),
    bye: index === 3 ? 1 : 0,
    buchholz: Math.max(0, 8 - index)
  })),
  tribeStats: [
    { tribe: "comet", participantsCount: 3, totalScore: 7, averageScore: 2.33, totalRankScore: 13, averageRankScore: 4.33, bestPlace: 1 },
    { tribe: "star", participantsCount: 2, totalScore: 3, averageScore: 1.5, totalRankScore: 9, averageRankScore: 4.5, bestPlace: 2 },
    { tribe: "satellite", participantsCount: 2, totalScore: 2, averageScore: 1, totalRankScore: 5, averageRankScore: 2.5, bestPlace: 4 }
  ]
};

export const mockAudit: AuditRecord[] = [];

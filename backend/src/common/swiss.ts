export function getRecommendedSwissRounds(participantCount: number): number {
  if (participantCount <= 15) return 4;
  if (participantCount <= 23) return 5;
  return 6;
}

export function isStartParticipantCountValid(participantCount: number): boolean {
  return participantCount >= 10 && participantCount <= 30;
}

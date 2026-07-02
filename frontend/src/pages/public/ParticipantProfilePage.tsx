import { Link, useParams } from "react-router-dom";
import { MatchView, Participant } from "../../api/types";
import { PageTitle } from "../../components/PageTitle";
import { ScoreBadge } from "../../components/ScoreBadge";
import { TribeBadge } from "../../components/TribeBadge";
import { useBracket, useParticipants, usePublicOverview } from "../../features/hooks";

interface ParticipantMatchRow {
  match: MatchView;
  opponent: {
    id: string;
    nickname: string;
  } | null;
  participantScore: number | null;
  opponentScore: number | null;
  result: "win" | "loss" | "pending" | "bye";
}

function getParticipantMatches(participantId: string, matches: MatchView[]): ParticipantMatchRow[] {
  return matches
    .filter((match) => match.participantA?.id === participantId || match.participantB?.id === participantId)
    .map((match) => {
      const isParticipantA = match.participantA?.id === participantId;
      const opponent = isParticipantA ? match.participantB : match.participantA;
      const participantScore = isParticipantA ? match.scoreA : match.scoreB;
      const opponentScore = isParticipantA ? match.scoreB : match.scoreA;
      const result: ParticipantMatchRow["result"] =
        match.status === "bye"
          ? "bye"
          : match.status !== "finished"
            ? "pending"
            : match.winnerId === participantId
              ? "win"
              : "loss";

      return {
        match,
        opponent: opponent ? { id: opponent.id, nickname: opponent.nickname } : null,
        participantScore,
        opponentScore,
        result
      };
    })
    .sort((a, b) => a.match.roundNumber - b.match.roundNumber || a.match.matchNumber - b.match.matchNumber);
}

function resultLabel(row: ParticipantMatchRow): string {
  if (row.result === "bye") return "BYE";
  if (row.result === "pending") return "Ожидает";
  if (row.match.resultType === "technical_loss_both") return "Тех. поражение";
  if (row.match.resultType === "technical_loss_a" || row.match.resultType === "technical_loss_b") {
    return row.result === "win" ? "Тех. победа" : "Тех. поражение";
  }
  return row.result === "win" ? "Победа" : "Поражение";
}

function ParticipantHeader({ participant }: { participant: Participant }): JSX.Element {
  return (
    <section className="rounded-lg border border-white/10 bg-panel/90 p-4">
      <div className="grid gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-textMuted">Ник</p>
          <p className="mt-1 text-lg font-semibold text-textMain">{participant.nickname}</p>
        </div>
        <div>
          <p className="text-xs text-textMuted">Имя</p>
          <p className="mt-1 text-sm text-textMain">{participant.fullName || "Не указано"}</p>
        </div>
        <div>
          <p className="text-xs text-textMuted">Telegram</p>
          <p className="mt-1 text-sm text-textMain">{participant.telegramContact || "Не указан"}</p>
        </div>
        <div>
          <p className="text-xs text-textMuted">Трайб</p>
          <div className="mt-1">
            <TribeBadge tribe={participant.tribe} />
          </div>
        </div>
      </div>
    </section>
  );
}

export function ParticipantProfilePage(): JSX.Element {
  const { participantId } = useParams<{ participantId: string }>();
  const participantsQuery = useParticipants();
  const bracketQuery = useBracket();
  const overviewQuery = usePublicOverview();

  if (participantsQuery.isLoading || bracketQuery.isLoading || overviewQuery.isLoading) {
    return <p className="rounded-lg border border-white/10 bg-panel/80 p-4 text-textMuted">Загрузка участника...</p>;
  }

  if (
    participantsQuery.isError ||
    bracketQuery.isError ||
    overviewQuery.isError ||
    !participantsQuery.data ||
    !bracketQuery.data ||
    !overviewQuery.data
  ) {
    return <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-rose-200">Ошибка загрузки данных</p>;
  }

  const participant = participantsQuery.data.find((item) => item.id === participantId);

  if (!participant) {
    return (
      <div className="space-y-4">
        <PageTitle title="Участник не найден" />
        <Link className="text-sm text-accent hover:text-accent/80" to="/participants">
          Вернуться к списку участников
        </Link>
      </div>
    );
  }

  const matches = getParticipantMatches(participant.id, bracketQuery.data.rounds.flatMap((round) => round.matches));

  return (
    <div className="space-y-4">
      <PageTitle
        title={participant.nickname}
        subtitle={overviewQuery.data?.tournament.title}
        rightSlot={
          <Link className="text-sm text-accent hover:text-accent/80" to="/participants">
            Все участники
          </Link>
        }
      />

      <ParticipantHeader participant={participant} />

      <section className="rounded-lg border border-white/10 bg-panel/90 p-4">
        <h3 className="mb-3 text-lg font-semibold text-textMain">Игры в турах</h3>
        {matches.length === 0 ? (
          <p className="text-sm text-textMuted">Игр пока нет</p>
        ) : (
          <div className="overflow-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="text-textMuted">
                <tr>
                  <th className="pb-2">Тур</th>
                  <th className="pb-2">Соперник</th>
                  <th className="pb-2">Счет</th>
                  <th className="pb-2">Результат</th>
                </tr>
              </thead>
              <tbody>
                {matches.map((row) => (
                  <tr key={row.match.id} className="border-t border-white/5">
                    <td className="py-2 text-textMain">Тур {row.match.roundNumber}</td>
                    <td className="py-2 text-textMain">
                      {row.opponent ? (
                        <Link className="text-accent hover:text-accent/80" to={`/participants/${row.opponent.id}`}>
                          {row.opponent.nickname}
                        </Link>
                      ) : (
                        <span className="text-textMuted">Пропуск тура</span>
                      )}
                    </td>
                    <td className="py-2">
                      {row.result === "bye" ? (
                        <span className="text-textMuted">bye</span>
                      ) : (
                        <ScoreBadge
                          scoreA={row.participantScore}
                          scoreB={row.opponentScore}
                          resultType={row.match.resultType}
                        />
                      )}
                    </td>
                    <td className="py-2 text-textMuted">{resultLabel(row)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

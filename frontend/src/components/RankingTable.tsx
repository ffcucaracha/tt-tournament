import { Link } from "react-router-dom";
import { StandingRow, TribeStatsRow } from "../api/types";
import { TribeBadge } from "./TribeBadge";

const compactHeadCellClass = "w-14 px-1 pb-2 text-center";
const compactBodyCellClass = "w-14 px-1 py-2 text-center";

interface RankingTableProps {
  standings: StandingRow[];
  tribeStats: TribeStatsRow[];
}

export function RankingTable({ standings, tribeStats }: RankingTableProps): JSX.Element {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="rounded-lg border border-white/10 bg-panel/90 p-4 lg:col-span-2">
        <h3 className="mb-3 text-lg font-semibold text-textMain">Итоговые места</h3>
        <div className="overflow-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="text-textMuted">
              <tr>
                <th className="pb-2">Место</th>
                <th className="pb-2">Игрок</th>
                <th className="pb-2">Трайб</th>
                <th className={compactHeadCellClass}>Игры</th>
                <th className={compactHeadCellClass}>W-L</th>
                <th className={compactHeadCellClass}>Bye</th>
                <th className={compactHeadCellClass}>Очки</th>
                <th className={compactHeadCellClass}>Buchholz</th>
                <th className={compactHeadCellClass}>Баллы</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((row, index) => (
                <tr key={row.participantId} className="border-t border-white/5">
                  <td className="py-2 text-textMain">{row.place}</td>
                  <td className="py-2">
                    <Link className="text-accent hover:text-accent/80" to={`/participants/${row.participantId}`}>
                      {row.nickname}
                    </Link>
                  </td>
                  <td className="py-2">
                    <TribeBadge tribe={row.tribe} compact />
                  </td>
                  <td className={`${compactBodyCellClass} text-textMuted`}>{row.games ?? row.wins + row.losses}</td>
                  <td className={`${compactBodyCellClass} text-textMuted`}>
                    {row.wins}-{row.losses}
                  </td>
                  <td className={`${compactBodyCellClass} text-textMuted`}>{row.bye ?? 0}</td>
                  <td className={`${compactBodyCellClass} text-textMain`}>{row.score}</td>
                  <td className={`${compactBodyCellClass} text-textMuted`}>{row.buchholz ?? 0}</td>
                  <td className={`${compactBodyCellClass} text-base font-semibold text-textMain`}>
                    {row.rankScore ?? standings.length - index}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-lg border border-white/10 bg-panel/90 p-4">
        <h3 className="mb-3 text-lg font-semibold text-textMain">Рейтинг трайбов</h3>
        <div className="space-y-2">
          {tribeStats.map((row) => (
            <div key={row.tribe} className="rounded-md border border-white/10 bg-panelSoft/80 p-3">
              <div className="flex items-center justify-between">
                <TribeBadge tribe={row.tribe} />
                <span className="text-sm text-textMuted">avg {row.averageRankScore}</span>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-textMuted sm:grid-cols-4">
                <span>Участники: {row.participantsCount}</span>
                <span>Баллы: {row.totalRankScore}</span>
                <span>Очки: {row.totalScore}</span>
                <span>Лучшее: {row.bestPlace}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

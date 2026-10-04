import { desc, eq } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { games, series } from '~~/server/db/schema'

export interface SeriesTally {
  id: string
  name: string
  played: number
  /** One row per player who has appeared in the series, most wins first. */
  standings: { playerId: string; name: string; wins: number }[]
}

export default defineEventHandler(async (event): Promise<SeriesTally[]> => {
  await requireUserSession(event)
  const db = useDb()
  const [allSeries, finished] = await Promise.all([
    db.select().from(series).orderBy(desc(series.createdAt)),
    db
      .select({ seriesId: games.seriesId, state: games.state, winners: games.winnerPlayerIds })
      .from(games)
      .where(eq(games.status, 'finished')),
  ])

  return allSeries.map((s) => {
    const rows = finished.filter((g) => g.seriesId === s.id)
    const standings = new Map<string, { playerId: string; name: string; wins: number }>()
    for (const g of rows) {
      for (const p of g.state.players) {
        if (p.playerId && !standings.has(p.playerId))
          standings.set(p.playerId, { playerId: p.playerId, name: p.name, wins: 0 })
      }
      for (const id of g.winners) {
        const entry = standings.get(id)
        if (entry) entry.wins += 1
      }
    }
    return {
      id: s.id,
      name: s.name,
      played: rows.length,
      standings: [...standings.values()].sort((a, b) => b.wins - a.wins),
    }
  })
})

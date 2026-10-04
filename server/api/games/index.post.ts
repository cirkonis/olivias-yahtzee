import { inArray } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { games, players } from '~~/server/db/schema'
import { createGameSchema } from '~~/server/db/validators'
import { newGame } from '~~/shared/yahtzee'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const body = await readValidatedBody(event, createGameSchema.parse)
  const db = useDb()

  const ids = body.players.map((p) => p.playerId)
  const rows = await db.select().from(players).where(inArray(players.id, ids))
  const byId = new Map(rows.map((r) => [r.id, r]))
  if (byId.size !== new Set(ids).size || byId.size !== ids.length) {
    throw createError({ statusCode: 400, statusMessage: 'Unknown or repeated player' })
  }

  // Keep the order chosen at setup — that's the turn order.
  const state = newGame(ids.map((id) => ({ playerId: id, name: byId.get(id)!.name })))
  const [row] = await db
    .insert(games)
    .values({ state, seriesId: body.seriesId ?? null })
    .returning()
  return row
})

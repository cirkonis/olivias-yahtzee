import { eq } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { games } from '~~/server/db/schema'
import { updateGameSchema } from '~~/server/db/validators'
import { isGameComplete, winners } from '~~/shared/yahtzee'

/** Save the whole sheet. Status and winners are worked out here, never trusted from the client. */
export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const id = getRouterParam(event, 'id')!
  const { state } = await readValidatedBody(event, updateGameSchema.parse)

  const done = isGameComplete(state)
  const winnerPlayerIds = done
    ? winners(state).flatMap((i) => (state.players[i]!.playerId ? [state.players[i]!.playerId!] : []))
    : []

  const [row] = await useDb()
    .update(games)
    .set({
      state,
      status: done ? 'finished' : 'active',
      winnerPlayerIds,
      finishedAt: done ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(games.id, id))
    .returning()

  if (!row) throw createError({ statusCode: 404, statusMessage: 'Game not found' })
  return row
})

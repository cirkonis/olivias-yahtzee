import { eq } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { games } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const id = getRouterParam(event, 'id')!
  const [row] = await useDb().select().from(games).where(eq(games.id, id))
  if (!row) throw createError({ statusCode: 404, statusMessage: 'Game not found' })
  return row
})

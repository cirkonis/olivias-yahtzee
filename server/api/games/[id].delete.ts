import { eq } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { games } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const id = getRouterParam(event, 'id')!
  await useDb().delete(games).where(eq(games.id, id))
  return { ok: true }
})

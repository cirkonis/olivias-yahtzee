import { desc, eq } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { games } from '~~/server/db/schema'
import { gamesQuerySchema } from '~~/server/db/validators'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const { status } = await getValidatedQuery(event, gamesQuerySchema.parse)
  const db = useDb()
  const query = db.select().from(games).orderBy(desc(games.updatedAt)).limit(50)
  return status ? query.where(eq(games.status, status)) : query
})

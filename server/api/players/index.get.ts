import { asc } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { players } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  return useDb().select().from(players).orderBy(asc(players.name))
})

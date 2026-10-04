import { useDb } from '~~/server/db'
import { players } from '~~/server/db/schema'
import { createPlayerSchema } from '~~/server/db/validators'

/** Add a name — or hand back the existing one if it's already saved. */
export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const { name } = await readValidatedBody(event, createPlayerSchema.parse)
  const [row] = await useDb()
    .insert(players)
    .values({ name })
    .onConflictDoUpdate({ target: players.name, set: { name } })
    .returning()
  return row
})

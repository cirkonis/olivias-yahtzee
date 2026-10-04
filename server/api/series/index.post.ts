import { useDb } from '~~/server/db'
import { series } from '~~/server/db/schema'
import { createSeriesSchema } from '~~/server/db/validators'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const body = await readValidatedBody(event, createSeriesSchema.parse)
  const [row] = await useDb().insert(series).values(body).returning()
  return row
})

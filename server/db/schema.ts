import { pgTable, uuid, text, jsonb, index, timestamp } from 'drizzle-orm/pg-core'
import type { GameState } from '~~/shared/yahtzee'

export const GAME_STATUSES = ['active', 'finished'] as const
export type GameStatus = (typeof GAME_STATUSES)[number]

/** Saved names, so setup is a couple of taps instead of typing. */
export const players = pgTable('players', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

/** A named run of games, e.g. "Mike vs Olivia". The tally is counted from its finished games. */
export const series = pgTable('series', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

/**
 * One game. The whole sheet (players, cards, turn, undo history) lives in
 * `state` — it's small and always read and written whole.
 * `status` and `winnerPlayerIds` are derived from `state` on every save.
 */
export const games = pgTable(
  'games',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    seriesId: uuid('series_id').references(() => series.id, { onDelete: 'set null' }),
    status: text('status').notNull().$type<GameStatus>().default('active'),
    state: jsonb('state').notNull().$type<GameState>(),
    winnerPlayerIds: jsonb('winner_player_ids').notNull().$type<string[]>().default([]),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    finishedAt: timestamp('finished_at', { withTimezone: true }),
  },
  (t) => [index('games_status_idx').on(t.status), index('games_series_idx').on(t.seriesId)],
)

export type Player = typeof players.$inferSelect
export type Series = typeof series.$inferSelect
export type Game = typeof games.$inferSelect

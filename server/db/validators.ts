import { z } from 'zod'
import { CATEGORIES, MAX_PLAYERS, isValidScore, type Category } from '~~/shared/yahtzee'

const name = z.string().trim().min(1).max(40)

const scores = z
  .object(Object.fromEntries(CATEGORIES.map((c) => [c, z.number().int().nullable()])) as Record<
    Category,
    z.ZodNullable<z.ZodNumber>
  >)
  .refine((s) => CATEGORIES.every((c) => s[c] === null || isValidScore(c, s[c])), {
    message: 'Score not allowed in that box',
  })

const card = z.object({
  scores,
  yahtzeeBonus: z.number().int().min(0).max(12),
})

const gamePlayer = z.object({
  name,
  playerId: z.string().uuid().optional(),
})

export const gameStateSchema = z
  .object({
    mode: z.literal('score'),
    players: z.array(gamePlayer).min(1).max(MAX_PLAYERS),
    cards: z.array(card),
    current: z.number().int().min(0),
    history: z.array(
      z.object({
        player: z.number().int().min(0),
        prevCard: card,
        prevCurrent: z.number().int().min(0),
      }),
    ),
  })
  .refine((g) => g.cards.length === g.players.length && g.current < g.players.length, {
    message: 'Cards and players out of step',
  })

export const createPlayerSchema = z.object({ name })

export const createSeriesSchema = z.object({ name })

export const createGameSchema = z.object({
  players: z.array(z.object({ playerId: z.string().uuid() })).min(1).max(MAX_PLAYERS),
  seriesId: z.string().uuid().nullable().optional(),
})

export const updateGameSchema = z.object({ state: gameStateSchema })

export const gamesQuerySchema = z.object({
  status: z.enum(['active', 'finished']).optional(),
})

/**
 * Pure Yahtzee scoring rules, shared by the app and the server.
 *
 * Nothing in here knows about screens, storage or dice — score keeping mode
 * sits on top of it today, and a future play mode can reuse it unchanged.
 */

export const UPPER = ['aces', 'twos', 'threes', 'fours', 'fives', 'sixes'] as const
export const LOWER = [
  'threeKind',
  'fourKind',
  'fullHouse',
  'smStraight',
  'lgStraight',
  'yahtzee',
  'chance',
] as const
export const CATEGORIES = [...UPPER, ...LOWER] as const

export type UpperCategory = (typeof UPPER)[number]
export type LowerCategory = (typeof LOWER)[number]
export type Category = (typeof CATEGORIES)[number]

/** How a box is entered on the phone. */
export type EntryKind = 'upper' | 'fixed' | 'sum'

export interface CategoryInfo {
  label: string
  /** Column-width label for the full sheet. */
  short: string
  kind: EntryKind
  /** Upper boxes: the face being counted. */
  face?: number
  /** Fixed boxes: the only non-zero score allowed. */
  fixed?: number
  /** The "how to score" copy that lives behind the info icon. */
  help: string
}

export const CATEGORY_INFO: Record<Category, CategoryInfo> = {
  aces: { label: 'Aces', short: '1s', kind: 'upper', face: 1, help: 'Count and add only the 1s.' },
  twos: { label: 'Twos', short: '2s', kind: 'upper', face: 2, help: 'Count and add only the 2s.' },
  threes: { label: 'Threes', short: '3s', kind: 'upper', face: 3, help: 'Count and add only the 3s.' },
  fours: { label: 'Fours', short: '4s', kind: 'upper', face: 4, help: 'Count and add only the 4s.' },
  fives: { label: 'Fives', short: '5s', kind: 'upper', face: 5, help: 'Count and add only the 5s.' },
  sixes: { label: 'Sixes', short: '6s', kind: 'upper', face: 6, help: 'Count and add only the 6s.' },
  threeKind: {
    label: '3 of a Kind',
    short: '3K',
    kind: 'sum',
    help: 'At least three dice the same. Score the total of all five dice.',
  },
  fourKind: {
    label: '4 of a Kind',
    short: '4K',
    kind: 'sum',
    help: 'At least four dice the same. Score the total of all five dice.',
  },
  fullHouse: {
    label: 'Full House',
    short: 'FH',
    kind: 'fixed',
    fixed: 25,
    help: 'Three of one number and two of another. Scores 25.',
  },
  smStraight: {
    label: 'Sm Straight',
    short: 'SS',
    kind: 'fixed',
    fixed: 30,
    help: 'Four in a row (1-2-3-4, 2-3-4-5 or 3-4-5-6). Scores 30.',
  },
  lgStraight: {
    label: 'Lg Straight',
    short: 'LS',
    kind: 'fixed',
    fixed: 40,
    help: 'Five in a row (1-2-3-4-5 or 2-3-4-5-6). Scores 40.',
  },
  yahtzee: {
    label: 'Yahtzee',
    short: 'YZ',
    kind: 'fixed',
    fixed: 50,
    help: 'All five dice the same. Scores 50.',
  },
  chance: {
    label: 'Chance',
    short: 'Ch',
    kind: 'sum',
    help: 'Anything goes. Score the total of all five dice.',
  },
}

export const UPPER_BONUS_THRESHOLD = 63
export const UPPER_BONUS = 35
export const YAHTZEE_BONUS = 100

export const YAHTZEE_BONUS_HELP =
  'Rolled another Yahtzee after already scoring 50 in the Yahtzee box? ' +
  'You get a 100 point bonus, and you still fill in a box this turn. ' +
  'Use the matching upper box if it is open — otherwise any box, and Full House or ' +
  'the Straights score their full value (the Joker rule). ' +
  'No bonus if the Yahtzee box was scratched with a 0.'

/** Sum boxes (3K, 4K, Chance) are five dice added up, so 5–30 — or a 0 scratch. */
export const SUM_MIN = 5
export const SUM_MAX = 30

/** One player's sheet. `null` = still open; `0` = deliberately scratched. */
export interface Card {
  scores: Record<Category, number | null>
  /** Number of 100-point Yahtzee bonuses earned. */
  yahtzeeBonus: number
}

export function emptyCard(): Card {
  return {
    scores: Object.fromEntries(CATEGORIES.map((c) => [c, null])) as Card['scores'],
    yahtzeeBonus: 0,
  }
}

/** Is `value` a score that box can actually hold? */
export function isValidScore(category: Category, value: number) {
  if (!Number.isInteger(value) || value < 0) return false
  const info = CATEGORY_INFO[category]
  if (value === 0) return true
  switch (info.kind) {
    case 'upper':
      return value % info.face! === 0 && value / info.face! <= 5
    case 'fixed':
      return value === info.fixed
    case 'sum':
      return value >= SUM_MIN && value <= SUM_MAX
  }
}

const sumOf = (card: Card, cats: readonly Category[]) =>
  cats.reduce((acc, c) => acc + (card.scores[c] ?? 0), 0)

export const upperSubtotal = (card: Card) => sumOf(card, UPPER)
export const upperBonus = (card: Card) =>
  upperSubtotal(card) >= UPPER_BONUS_THRESHOLD ? UPPER_BONUS : 0
export const upperTotal = (card: Card) => upperSubtotal(card) + upperBonus(card)
export const yahtzeeBonusTotal = (card: Card) => card.yahtzeeBonus * YAHTZEE_BONUS
export const lowerTotal = (card: Card) => sumOf(card, LOWER) + yahtzeeBonusTotal(card)
export const grandTotal = (card: Card) => upperTotal(card) + lowerTotal(card)

/** Par for an upper box: three of that face. Par in every box is exactly 63. */
export const upperPar = (category: UpperCategory) => CATEGORY_INFO[category].face! * 3

/**
 * The bonus index: how far ahead (+) or behind (−) of par the filled upper
 * boxes are. 8 in Fours is −4; then 20 in Fives makes it +1, so Aces only
 * needs 2 to stay on course for the bonus.
 */
export function parIndex(card: Card) {
  return UPPER.reduce((acc, c) => {
    const v = card.scores[c]
    return v === null ? acc : acc + v - upperPar(c)
  }, 0)
}

export type BonusState = 'secured' | 'lost' | 'chasing'

/** Has the 35 already been banked, become impossible, or is it still in play? */
export function bonusState(card: Card): BonusState {
  const subtotal = upperSubtotal(card)
  if (subtotal >= UPPER_BONUS_THRESHOLD) return 'secured'
  const bestCase = UPPER.reduce(
    (acc, c) => acc + (card.scores[c] === null ? CATEGORY_INFO[c].face! * 5 : 0),
    subtotal,
  )
  return bestCase < UPPER_BONUS_THRESHOLD ? 'lost' : 'chasing'
}

/** A Yahtzee bonus only counts once the Yahtzee box holds a real 50. */
export const canEarnYahtzeeBonus = (card: Card) => card.scores.yahtzee === 50

export const isCardComplete = (card: Card) => CATEGORIES.every((c) => card.scores[c] !== null)
export const filledCount = (card: Card) => CATEGORIES.filter((c) => card.scores[c] !== null).length

// ---------------------------------------------------------------------------
// Game state — score keeping mode
// ---------------------------------------------------------------------------

export const MAX_PLAYERS = 6

export interface GamePlayer {
  name: string
  /** Saved player id when signed in; absent in the open version. */
  playerId?: string
}

/** One undoable step: the card as it was, and whose turn it was. */
export interface HistoryStep {
  player: number
  prevCard: Card
  prevCurrent: number
}

export interface GameState {
  mode: 'score'
  players: GamePlayer[]
  cards: Card[]
  /** Whose card is on screen — and whose turn it is. */
  current: number
  history: HistoryStep[]
}

export function newGame(players: GamePlayer[]): GameState {
  return {
    mode: 'score',
    players,
    cards: players.map(() => emptyCard()),
    current: 0,
    history: [],
  }
}

export const isGameComplete = (g: GameState) => g.cards.every(isCardComplete)

/** Next player after `from` who still has open boxes (or `from` itself if nobody else does). */
export function nextPlayer(g: GameState, from: number) {
  const n = g.players.length
  for (let step = 1; step <= n; step++) {
    const i = (from + step) % n
    if (!isCardComplete(g.cards[i]!)) return i
  }
  return from
}

const cloneCard = (card: Card): Card => ({ scores: { ...card.scores }, yahtzeeBonus: card.yahtzeeBonus })

/**
 * Write a score into the current player's box. Filling an open box ends the
 * turn and moves on; changing an already-filled box is a correction and stays put.
 */
export function applyEntry(
  g: GameState,
  category: Category,
  value: number,
  withYahtzeeBonus = false,
): GameState {
  const player = g.current
  const card = g.cards[player]!
  if (!isValidScore(category, value)) throw new Error(`Invalid score ${value} for ${category}`)

  const wasOpen = card.scores[category] === null
  const next = cloneCard(card)
  next.scores[category] = value
  if (withYahtzeeBonus && canEarnYahtzeeBonus(card)) next.yahtzeeBonus += 1

  const cards = g.cards.map((c, i) => (i === player ? next : c))
  const after: GameState = {
    ...g,
    cards,
    history: [...g.history, { player, prevCard: cloneCard(card), prevCurrent: g.current }],
  }
  after.current = wasOpen ? nextPlayer(after, player) : player
  return after
}

export function undo(g: GameState): GameState {
  const last = g.history.at(-1)
  if (!last) return g
  return {
    ...g,
    cards: g.cards.map((c, i) => (i === last.player ? cloneCard(last.prevCard) : c)),
    current: last.prevCurrent,
    history: g.history.slice(0, -1),
  }
}

/** Indexes of the top scorer(s) — ties share the win. */
export function winners(g: GameState) {
  const totals = g.cards.map(grandTotal)
  const best = Math.max(...totals)
  return totals.flatMap((t, i) => (t === best ? [i] : []))
}

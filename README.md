# Olivia's Yahtzee

A Yahtzee score sheet made for thumbs. One player's card at a time, big rows,
the "how to score" copy tucked behind an info icon, and a running **bonus index**
so you always know where you stand on the upper-section 35.

This is **score keeping mode** — you roll real dice, the app keeps the sheet.
A dice-rolling **play mode** may come later as its own mode, reusing the same
scoring rules rather than replacing this.

## Stack

- **Nuxt 4** (pages fetch client-side behind auth)
- **Tailwind CSS 4**
- **Drizzle ORM** + **Neon** Postgres
- **nuxt-auth-utils** for a single-password gate
- Deployed on **Vercel** (`nitro.preset: 'vercel'`)

## Local setup

```bash
nvm use            # Node 22
npm install
cp .env.example .env   # then fill it in
npm run dev
```

### Environment

| Variable | What it's for |
| --- | --- |
| `NUXT_SESSION_PASSWORD` | Encrypts the session cookie. `openssl rand -base64 32` |
| `NUXT_APP_PASSWORD` | The one password that unlocks saved games and series |
| `POSTGRES_URL` | Pooled Neon connection string (runtime) |
| `POSTGRES_URL_NON_POOLING` | Direct connection string (migrations) |

### Database

```bash
npm run db:generate   # create a migration from schema.ts
npm run db:migrate    # apply migrations
npm run db:studio     # browse the data
```

## Two ways in

- **Quick game** (`/open`) — anyone, no sign-in. The game lives in that phone's
  `localStorage` and never touches the database.
- **Signed in** — games save to Neon after every entry, so a game can be picked up
  on another phone, and finished games count towards a **series**.

## The bonus index

Par for each upper box is three of that face (3, 6, 9, 12, 15, 18) — par in every
box is exactly 63, the bonus line. The index is how far ahead or behind par the
filled boxes are:

- 8 in Fours (par 12) → **−4**
- then 20 in Fives (par 15) → **+1**
- so Aces only needs **2** to stay on course.

Each open upper box shows what it needs ("need 2×"); "par 3×" means that box alone
can't close the gap. The chip turns into **✓ 35** once the bonus is banked, and
strikes through once it's out of reach.

## Data model

- **`players`** — saved names, so setup is a couple of taps.
- **`series`** — a named run of games, e.g. "Mike vs Olivia". The win/loss tally is
  counted from its finished games (ties share the win).
- **`games`** — the whole sheet (players, cards, whose turn, undo history) in one
  `state` jsonb. `status` and `winner_player_ids` are derived from `state` on the
  server at every save, never trusted from the client.

All scoring rules live in [`shared/yahtzee.ts`](shared/yahtzee.ts) — pure functions
used by both the app and the API, with no idea about screens, storage or dice.

## Scoring

Standard Hasbro sheet: upper bonus 35 at 63, Full House 25, Sm Straight 30,
Lg Straight 40, Yahtzee 50. A **bonus Yahtzee** (+100) is a toggle on the entry sheet,
offered only once the Yahtzee box holds a real 50; the player fills a box as normal
(Joker rule — the app trusts you rather than policing it). Filling an open box moves
to the next player automatically; changing a filled box is a correction and stays put.
Undo walks back any step.

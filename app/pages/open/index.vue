<script setup lang="ts">
import { newGame, type GameState } from '~~/shared/yahtzee'

/**
 * The open version: anyone can keep score, nothing touches the database.
 * The game lives in this browser only.
 */
definePageMeta({ layout: 'blank' })
useHead({ title: 'Quick game' })

const GAME_KEY = 'olivias-yahtzee:open-game'
const NAMES_KEY = 'olivias-yahtzee:open-names'

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function write(key: string, value: unknown) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Private mode or storage blocked — the game still works, it just won't survive a reload.
  }
}

const ready = ref(false)
const game = ref<GameState | null>(null)
const lastNames = ref<string[]>([])

onMounted(() => {
  const saved = read<GameState>(GAME_KEY)
  if (saved?.mode === 'score') game.value = saved
  lastNames.value = read<string[]>(NAMES_KEY) ?? []
  ready.value = true
})

watch(game, (g) => write(GAME_KEY, g), { deep: true })

function start(names: string[]) {
  write(NAMES_KEY, names)
  lastNames.value = names
  game.value = newGame(names.map((name) => ({ name })))
}

function rematch() {
  if (game.value) start(game.value.players.map((p) => p.name))
}

function endGame() {
  game.value = null
}
</script>

<template>
  <div v-if="ready" class="min-h-dvh bg-background">
    <ScoreBoard v-if="game" v-model="game" exit-to="/" @rematch="rematch" @end="endGame" />
    <template v-else>
      <header class="bg-primary text-primary-foreground" style="padding-top: env(safe-area-inset-top)">
        <div class="mx-auto flex h-14 max-w-lg items-center px-4">
          <NuxtLink to="/" class="text-xl font-black italic">Olivia's Yahtzee</NuxtLink>
        </div>
      </header>
      <main class="mx-auto max-w-lg px-4 pt-5 pb-10">
        <h1 class="mb-1 text-2xl font-black">Quick game</h1>
        <p class="text-muted-foreground mb-5 text-sm">Kept on this phone only — nothing is saved online.</p>
        <GameSetup :suggestions="lastNames" @start="start" />
      </main>
    </template>
  </div>
</template>

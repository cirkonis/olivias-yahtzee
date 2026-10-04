<script setup lang="ts">
import type { Game } from '~~/server/db/schema'
import { isGameComplete, type GameState } from '~~/shared/yahtzee'

definePageMeta({ layout: 'blank' })
useHead({ title: 'Game' })

const route = useRoute()
// Fixed for the life of this page; a different game remounts it.
const id = route.params.id as string

const row = ref<Game | null>(null)
const game = ref<GameState | null>(null)
const notFound = ref(false)
const loaded = ref(false)

const { failed, push, retry } = useSaveQueue((state: GameState) =>
  $fetch<Game>(`/api/games/${id}`, { method: 'PUT', body: { state } }),
)

// Only start saving once the loaded state is on screen, so loading isn't a save.
watch(game, (g) => loaded.value && g && push(g), { deep: true })

onMounted(async () => {
  try {
    row.value = await $fetch<Game>(`/api/games/${id}`)
    game.value = row.value.state
    await nextTick()
    loaded.value = true
  } catch {
    notFound.value = true
  }
})

async function rematch() {
  if (!game.value || !row.value) return
  const next = await $fetch<Game>('/api/games', {
    method: 'POST',
    body: {
      players: game.value.players.map((p) => ({ playerId: p.playerId })),
      seriesId: row.value.seriesId,
    },
  })
  // A new id remounts this page, which loads the fresh game.
  await navigateTo(`/score/${next.id}`)
}

async function end() {
  // A finished game stays in the history and the series; an abandoned one is dropped.
  if (game.value && !isGameComplete(game.value)) {
    await $fetch(`/api/games/${id}`, { method: 'DELETE' })
  }
  await navigateTo('/')
}
</script>

<template>
  <div class="min-h-dvh bg-background">
    <ScoreBoard
      v-if="game"
      v-model="game"
      exit-to="/"
      :save-error="failed"
      @rematch="rematch"
      @end="end"
      @retry-save="retry"
    />
    <div v-else-if="notFound" class="mx-auto max-w-lg px-4 pt-20 text-center">
      <p class="mb-4 text-lg font-semibold">That game isn't here.</p>
      <NuxtLink to="/"><Button>Home</Button></NuxtLink>
    </div>
  </div>
</template>

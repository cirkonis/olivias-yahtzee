<script setup lang="ts">
import type { Game, Player } from '~~/server/db/schema'
import type { SeriesTally } from '~~/server/api/series/index.get'

useHead({ title: 'New game' })

const saved = ref<Player[]>([])
const allSeries = ref<SeriesTally[]>([])
/** '' = no series, 'new' = create one, otherwise a series id. */
const seriesChoice = ref('')
const newSeriesName = ref('')
const busy = ref(false)
const error = ref<string | null>(null)

onMounted(async () => {
  ;[saved.value, allSeries.value] = await Promise.all([
    $fetch<Player[]>('/api/players'),
    $fetch<SeriesTally[]>('/api/series'),
  ])
})

async function start(names: string[]) {
  error.value = null
  busy.value = true
  try {
    // Save any new names; existing ones come back as-is.
    const players = await Promise.all(
      names.map((name) => $fetch<Player>('/api/players', { method: 'POST', body: { name } })),
    )

    let seriesId: string | null = seriesChoice.value || null
    if (seriesChoice.value === 'new') {
      const name = newSeriesName.value.trim() || names.join(' vs ')
      const s = await $fetch<{ id: string }>('/api/series', { method: 'POST', body: { name } })
      seriesId = s.id
    }

    const game = await $fetch<Game>('/api/games', {
      method: 'POST',
      body: { players: players.map((p) => ({ playerId: p.id })), seriesId },
    })
    await navigateTo(`/score/${game.id}`, { replace: true })
  } catch {
    error.value = "Couldn't start the game — try again."
    busy.value = false
  }
}
</script>

<template>
  <div>
    <h1 class="mb-5 text-2xl font-black">New game</h1>
    <GameSetup :suggestions="saved.map((p) => p.name)" :busy="busy" @start="start">
      <section>
        <h2 class="mb-2 text-sm font-semibold uppercase">Series</h2>
        <select v-model="seriesChoice" class="bg-card h-12 w-full rounded-lg border px-3">
          <option value="">No series — just this game</option>
          <option v-for="s in allSeries" :key="s.id" :value="s.id">{{ s.name }}</option>
          <option value="new">+ New series…</option>
        </select>
        <Input
          v-if="seriesChoice === 'new'"
          v-model="newSeriesName"
          placeholder="Series name (defaults to the players)"
          class="mt-2 h-12"
        />
      </section>
      <p v-if="error" class="text-destructive text-sm">{{ error }}</p>
    </GameSetup>
  </div>
</template>

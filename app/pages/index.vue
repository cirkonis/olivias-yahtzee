<script setup lang="ts">
import { LogOut, Play, Plus, Trophy, Zap } from 'lucide-vue-next'
import type { Game } from '~~/server/db/schema'
import type { SeriesTally } from '~~/server/api/series/index.get'
import { filledCount, grandTotal } from '~~/shared/yahtzee'

const { loggedIn, clear } = useUserSession()

const active = ref<Game[]>([])
const tallies = ref<SeriesTally[]>([])
const loading = ref(false)

async function load() {
  if (!loggedIn.value) return
  loading.value = true
  try {
    ;[active.value, tallies.value] = await Promise.all([
      $fetch<Game[]>('/api/games', { query: { status: 'active' } }),
      $fetch<SeriesTally[]>('/api/series'),
    ])
  } finally {
    loading.value = false
  }
}

onMounted(load)

async function signOut() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  await clear()
  active.value = []
  tallies.value = []
}

/** Rough progress: boxes filled across the whole table, out of 13 per player. */
function progress(g: Game) {
  const filled = g.state.cards.reduce((acc, c) => acc + filledCount(c), 0)
  return Math.round((filled / (g.state.cards.length * 13)) * 100)
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <template v-if="loggedIn">
      <NuxtLink to="/score/new">
        <Button size="xl" class="w-full"><Plus /> New game</Button>
      </NuxtLink>

      <section v-if="active.length">
        <h2 class="mb-2 text-sm font-semibold uppercase">In progress</h2>
        <div class="flex flex-col gap-2">
          <NuxtLink v-for="g in active" :key="g.id" :to="`/score/${g.id}`">
            <Card class="flex-row items-center gap-3 p-4 active:bg-secondary">
              <Play class="text-primary size-5 shrink-0" />
              <div class="min-w-0 flex-1">
                <div class="truncate font-semibold">
                  {{ g.state.players.map((p, i) => `${p.name} ${grandTotal(g.state.cards[i]!)}`).join(' · ') }}
                </div>
                <div class="text-muted-foreground text-xs">{{ progress(g) }}% through</div>
              </div>
            </Card>
          </NuxtLink>
        </div>
      </section>

      <section v-if="tallies.length">
        <h2 class="mb-2 text-sm font-semibold uppercase">Series</h2>
        <div class="flex flex-col gap-2">
          <Card v-for="s in tallies" :key="s.id" class="gap-2 p-4">
            <div class="flex items-center justify-between">
              <span class="font-bold">{{ s.name }}</span>
              <span class="text-muted-foreground text-xs">{{ s.played }} played</span>
            </div>
            <div v-if="s.standings.length" class="flex flex-wrap gap-2">
              <span
                v-for="(p, i) in s.standings"
                :key="p.playerId"
                class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold"
                :class="i === 0 && p.wins > 0 ? 'bg-highlight text-highlight-foreground' : 'bg-secondary'"
              >
                <Trophy v-if="i === 0 && p.wins > 0" class="size-3.5" />
                {{ p.name }} <span class="tabular-nums">{{ p.wins }}</span>
              </span>
            </div>
            <p v-else class="text-muted-foreground text-sm">No finished games yet.</p>
          </Card>
        </div>
      </section>

      <div class="flex items-center justify-between pt-2">
        <NuxtLink to="/open" class="text-muted-foreground flex items-center gap-1 text-sm"><Zap class="size-4" /> Quick game (not saved)</NuxtLink>
        <button type="button" class="text-muted-foreground flex items-center gap-1 text-sm" @click="signOut">
          <LogOut class="size-4" /> Sign out
        </button>
      </div>
    </template>

    <template v-else>
      <div class="pt-6">
        <h1 class="text-4xl leading-tight font-black">Keep score,<br>not a spreadsheet.</h1>
        <p class="text-muted-foreground mt-2">A Yahtzee score sheet made for thumbs.</p>
      </div>
      <NuxtLink to="/open">
        <Button size="xl" class="w-full"><Zap /> Quick game</Button>
      </NuxtLink>
      <NuxtLink to="/login">
        <Button size="xl" variant="outline" class="w-full">Sign in to save games</Button>
      </NuxtLink>
    </template>
  </div>
</template>

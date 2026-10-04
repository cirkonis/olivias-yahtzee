<script setup lang="ts">
import { ChevronLeft, CloudOff, Crown, Info, Table2, Undo2 } from 'lucide-vue-next'
import {
  CATEGORY_INFO,
  LOWER,
  UPPER,
  UPPER_BONUS_THRESHOLD,
  applyEntry,
  grandTotal,
  isGameComplete,
  undo,
  upperSubtotal,
  yahtzeeBonusTotal,
  type Category,
} from '~~/shared/yahtzee'
import type { GameState } from '~~/shared/yahtzee'

const game = defineModel<GameState>({ required: true })

const props = defineProps<{
  exitTo: string
  saveError?: boolean
}>()

const emit = defineEmits<{
  rematch: []
  /** Finished with this game — the page decides what that means (clear it, delete it, go home). */
  end: []
  retrySave: []
}>()

const card = computed(() => game.value.cards[game.value.current]!)
const player = computed(() => game.value.players[game.value.current]!)
const done = computed(() => isGameComplete(game.value))
const lastStep = computed(() => game.value.history.at(-1))

const ranking = computed(() =>
  game.value.players
    .map((p, i) => ({ name: p.name, total: grandTotal(game.value.cards[i]!) }))
    .sort((a, b) => b.total - a.total),
)

// Entry sheet
const sheetOpen = ref(false)
const editing = ref<Category | null>(null)

function openEntry(c: Category) {
  editing.value = c
  sheetOpen.value = true
}

function onSave(value: number, withBonus: boolean) {
  if (!editing.value) return
  game.value = applyEntry(game.value, editing.value, value, withBonus)
}

function onUndo() {
  game.value = undo(game.value)
}

const undoLabel = computed(() => {
  const step = lastStep.value
  if (!step) return null
  const name = game.value.players[step.player]!.name
  // Find the box that step changed by comparing against the card now.
  const now = game.value.cards[step.player]!
  const changed = [...UPPER, ...LOWER].find((c) => now.scores[c] !== step.prevCard.scores[c])
  return changed ? `${name} · ${CATEGORY_INFO[changed].label}` : name
})

function setCurrent(i: number) {
  game.value = { ...game.value, current: i }
}

const fullSheetOpen = ref(false)

function confirmEnd() {
  if (confirm('End this game? The scores so far will be thrown away.')) emit('end')
}

// Swipe between players
const rowsEl = ref<HTMLElement | null>(null)
const { direction } = useSwipe(rowsEl, {
  threshold: 60,
  onSwipeEnd() {
    const n = game.value.players.length
    if (n < 2) return
    if (direction.value === 'left') setCurrent((game.value.current + 1) % n)
    if (direction.value === 'right') setCurrent((game.value.current - 1 + n) % n)
  },
})

// Info toggles per row
const helpOpen = ref(new Set<Category>())
function toggleHelp(c: Category) {
  const next = new Set(helpOpen.value)
  if (next.has(c)) next.delete(c)
  else next.add(c)
  helpOpen.value = next
}

function hint(c: Category) {
  const info = CATEGORY_INFO[c]
  if (info.kind === 'fixed') return String(info.fixed)
  return ''
}
</script>

<template>
  <div class="min-h-dvh pb-28">
    <!-- Header -->
    <header class="bg-primary text-primary-foreground sticky top-0 z-20" style="padding-top: env(safe-area-inset-top)">
      <div class="mx-auto flex h-14 max-w-lg items-center gap-2 px-2">
        <NuxtLink :to="props.exitTo" class="grid size-10 place-items-center rounded-lg" aria-label="Leave game">
          <ChevronLeft class="size-6" />
        </NuxtLink>
        <div class="min-w-0 flex-1 text-center">
          <div class="truncate text-xl font-black italic">{{ player.name }}</div>
        </div>
        <button
          v-if="props.saveError"
          type="button"
          class="bg-highlight text-highlight-foreground grid size-10 place-items-center rounded-lg"
          aria-label="Not saved — tap to retry"
          @click="emit('retrySave')"
        ><CloudOff class="size-5" /></button>
        <button
          type="button"
          class="grid size-10 place-items-center rounded-lg"
          aria-label="Full score sheet"
          @click="fullSheetOpen = true"
        ><Table2 class="size-6" /></button>
      </div>

      <!-- Player tabs -->
      <div v-if="game.players.length > 1" class="mx-auto flex max-w-lg gap-1 overflow-x-auto px-2 pb-2">
        <button
          v-for="(p, i) in game.players"
          :key="i"
          type="button"
          class="flex min-w-0 flex-1 flex-col items-center rounded-lg px-2 py-1 transition-colors"
          :class="i === game.current ? 'bg-card text-foreground' : 'bg-white/15'"
          @click="setCurrent(i)"
        >
          <span class="w-full truncate text-xs font-medium">{{ p.name }}</span>
          <span class="text-sm font-bold tabular-nums">{{ grandTotal(game.cards[i]!) }}</span>
        </button>
      </div>
    </header>

    <main ref="rowsEl" class="mx-auto flex max-w-lg flex-col gap-4 px-3 pt-4">
      <!-- Results -->
      <Card v-if="done" class="border-highlight border-2 p-4">
        <div class="mb-3 flex items-center gap-2 text-lg font-black">
          <Crown class="text-highlight size-6" /> Final scores
        </div>
        <ol class="flex flex-col gap-1">
          <li
            v-for="(r, i) in ranking"
            :key="r.name"
            class="flex items-center justify-between rounded-lg px-3 py-2"
            :class="r.total === ranking[0]!.total ? 'bg-highlight text-highlight-foreground font-bold' : ''"
          >
            <span>{{ i + 1 }}. {{ r.name }}</span>
            <span class="tabular-nums">{{ r.total }}</span>
          </li>
        </ol>
        <div class="mt-4 grid grid-cols-2 gap-2">
          <Button size="lg" @click="emit('rematch')">Rematch</Button>
          <Button size="lg" variant="outline" @click="emit('end')">Done</Button>
        </div>
      </Card>

      <!-- Totals strip -->
      <div class="flex items-end justify-between px-1">
        <div>
          <div class="text-muted-foreground text-xs font-medium uppercase">Total</div>
          <div class="text-5xl leading-none font-black tabular-nums">{{ grandTotal(card) }}</div>
        </div>
        <div class="text-right">
          <div class="text-muted-foreground text-xs font-medium uppercase">Bonus index</div>
          <BonusIndex :card="card" class="mt-1 px-3 py-1 text-xl" />
        </div>
      </div>

      <!-- Upper -->
      <Card class="gap-0 overflow-hidden py-0">
        <template v-for="c in UPPER" :key="c">
          <div class="flex min-h-14 items-center border-b">
            <button
              type="button"
              class="text-muted-foreground grid size-12 shrink-0 place-items-center"
              :aria-label="`How to score ${CATEGORY_INFO[c].label}`"
              @click="toggleHelp(c)"
            ><Info class="size-4" /></button>
            <button
              type="button"
              class="flex flex-1 items-center justify-between self-stretch pr-4 text-left active:bg-secondary"
              @click="openEntry(c)"
            >
              <span class="text-lg font-semibold">{{ CATEGORY_INFO[c].label }}</span>
              <span v-if="card.scores[c] !== null" class="text-2xl font-bold tabular-nums" :class="card.scores[c] === 0 ? 'text-muted-foreground' : ''">
                {{ card.scores[c] }}
              </span>
              <span v-else class="text-muted-foreground text-sm">{{ hint(c) }}</span>
            </button>
          </div>
          <p v-if="helpOpen.has(c)" class="bg-secondary text-muted-foreground border-b px-4 py-2 text-sm">
            {{ CATEGORY_INFO[c].help }} Par is {{ CATEGORY_INFO[c].face! * 3 }} (three of them).
          </p>
        </template>
        <div class="bg-secondary flex min-h-12 items-center justify-between px-4 font-semibold">
          <span>Upper</span>
          <span class="tabular-nums">{{ upperSubtotal(card) }} <span class="text-muted-foreground font-normal">/ {{ UPPER_BONUS_THRESHOLD }}</span></span>
        </div>
      </Card>

      <!-- Lower -->
      <Card class="gap-0 overflow-hidden py-0">
        <template v-for="c in LOWER" :key="c">
          <div class="flex min-h-14 items-center border-b">
            <button
              type="button"
              class="text-muted-foreground grid size-12 shrink-0 place-items-center"
              :aria-label="`How to score ${CATEGORY_INFO[c].label}`"
              @click="toggleHelp(c)"
            ><Info class="size-4" /></button>
            <button
              type="button"
              class="flex flex-1 items-center justify-between self-stretch pr-4 text-left active:bg-secondary"
              @click="openEntry(c)"
            >
              <span class="text-lg font-semibold">{{ CATEGORY_INFO[c].label }}</span>
              <span
                v-if="card.scores[c] !== null"
                class="text-2xl font-bold tabular-nums"
                :class="card.scores[c] === 0 ? 'text-muted-foreground' : c === 'yahtzee' ? 'bg-highlight text-highlight-foreground rounded px-1.5' : ''"
              >{{ card.scores[c] }}</span>
              <span v-else class="text-muted-foreground/60 text-sm">{{ hint(c) }}</span>
            </button>
          </div>
          <p v-if="helpOpen.has(c)" class="bg-secondary text-muted-foreground border-b px-4 py-2 text-sm">
            {{ CATEGORY_INFO[c].help }}
          </p>
        </template>
        <div v-if="card.yahtzeeBonus" class="bg-highlight text-highlight-foreground flex min-h-12 items-center justify-between px-4 font-bold">
          <span>Yahtzee bonus ×{{ card.yahtzeeBonus }}</span>
          <span class="tabular-nums">{{ yahtzeeBonusTotal(card) }}</span>
        </div>
      </Card>

      <button
        v-if="!done"
        type="button"
        class="text-muted-foreground mx-auto py-3 text-sm underline-offset-4 hover:underline"
        @click="confirmEnd"
      >End game early</button>
    </main>

    <!-- Undo bar -->
    <div
      v-if="lastStep"
      class="bg-card/95 fixed inset-x-0 bottom-0 z-20 border-t backdrop-blur-md"
      style="padding-bottom: env(safe-area-inset-bottom)"
    >
      <div class="mx-auto flex max-w-lg items-center gap-3 px-3 py-2">
        <Button variant="outline" size="lg" class="shrink-0" @click="onUndo">
          <Undo2 /> Undo
        </Button>
        <span class="text-muted-foreground truncate text-sm">{{ undoLabel }}</span>
      </div>
    </div>

    <EntrySheet v-model="sheetOpen" :category="editing" :card="card" :player-name="player.name" @save="onSave" />
    <FullSheet v-model="fullSheetOpen" :game="game" @pick="setCurrent" />
  </div>
</template>

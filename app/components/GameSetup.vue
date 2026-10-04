<script setup lang="ts">
import { ArrowUp, Plus, X } from 'lucide-vue-next'
import { MAX_PLAYERS } from '~~/shared/yahtzee'

const props = withDefaults(
  defineProps<{
    /** Names to offer as one-tap chips (saved players, or last game's). */
    suggestions?: string[]
    initial?: string[]
    busy?: boolean
  }>(),
  { suggestions: () => [], initial: () => [], busy: false },
)

const emit = defineEmits<{ start: [names: string[]] }>()

const names = ref<string[]>([...props.initial])
const draft = ref('')

const full = computed(() => names.value.length >= MAX_PLAYERS)
const has = (n: string) => names.value.some((x) => x.toLowerCase() === n.toLowerCase())
const unused = computed(() => props.suggestions.filter((s) => !has(s)))

function add(raw: string) {
  const n = raw.trim().slice(0, 40)
  if (!n || has(n) || full.value) return
  names.value.push(n)
  draft.value = ''
}

function remove(i: number) {
  names.value.splice(i, 1)
}

/** Move a player up one — the list order is the turn order. */
function raise(i: number) {
  if (i === 0) return
  const list = names.value
  ;[list[i - 1], list[i]] = [list[i]!, list[i - 1]!]
}
</script>

<template>
  <div class="flex flex-col gap-5">
    <section>
      <h2 class="mb-2 text-sm font-semibold uppercase">Players <span class="text-muted-foreground font-normal">· {{ names.length }}/{{ MAX_PLAYERS }} · turn order</span></h2>
      <ol v-if="names.length" class="flex flex-col gap-2">
        <li v-for="(n, i) in names" :key="n" class="bg-card flex h-14 items-center gap-2 rounded-xl border pr-1 pl-4">
          <span class="text-primary w-5 font-black">{{ i + 1 }}</span>
          <span class="flex-1 truncate text-lg font-semibold">{{ n }}</span>
          <button v-if="i > 0" type="button" class="text-muted-foreground grid size-11 place-items-center" :aria-label="`Move ${n} up`" @click="raise(i)">
            <ArrowUp class="size-5" />
          </button>
          <button type="button" class="text-muted-foreground grid size-11 place-items-center" :aria-label="`Remove ${n}`" @click="remove(i)">
            <X class="size-5" />
          </button>
        </li>
      </ol>
      <p v-else class="text-muted-foreground text-sm">Add up to {{ MAX_PLAYERS }} players.</p>
    </section>

    <form v-if="!full" class="flex gap-2" @submit.prevent="add(draft)">
      <Input v-model="draft" placeholder="Name" class="h-12" autocapitalize="words" enterkeyhint="done" />
      <Button type="submit" size="icon" class="size-12 shrink-0" :disabled="!draft.trim()" aria-label="Add player">
        <Plus class="size-6" />
      </Button>
    </form>

    <div v-if="unused.length && !full" class="flex flex-wrap gap-2">
      <button
        v-for="s in unused"
        :key="s"
        type="button"
        class="bg-secondary flex h-10 items-center gap-1 rounded-full px-4 font-medium"
        @click="add(s)"
      ><Plus class="size-4" /> {{ s }}</button>
    </div>

    <slot />

    <Button size="xl" :disabled="!names.length || props.busy" @click="emit('start', names)">
      {{ props.busy ? 'Starting…' : 'Start game' }}
    </Button>
  </div>
</template>

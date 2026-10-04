<script setup lang="ts">
import { Delete, Info } from 'lucide-vue-next'
import {
  CATEGORY_INFO,
  SUM_MAX,
  SUM_MIN,
  YAHTZEE_BONUS_HELP,
  canEarnYahtzeeBonus,
  isValidScore,
  type Card,
  type Category,
} from '~~/shared/yahtzee'

const open = defineModel<boolean>({ required: true })

const props = defineProps<{
  category: Category | null
  card: Card
  playerName: string
}>()

const emit = defineEmits<{
  save: [value: number, withYahtzeeBonus: boolean]
}>()

const info = computed(() => (props.category ? CATEGORY_INFO[props.category] : null))
const current = computed(() => (props.category ? props.card.scores[props.category] : null))

const bonus = ref(false)
const showBonusHelp = ref(false)
const typed = ref('')

watch(open, (v) => {
  if (!v) return
  bonus.value = false
  showBonusHelp.value = false
  typed.value = ''
})

/** Offer the bonus toggle on any box once the Yahtzee box holds a real 50. */
const offerBonus = computed(
  () => !!props.category && props.category !== 'yahtzee' && canEarnYahtzeeBonus(props.card),
)

const upperOptions = computed(() => {
  if (info.value?.kind !== 'upper') return []
  const face = info.value.face!
  return [0, 1, 2, 3, 4, 5].map((count) => ({ count, value: count * face }))
})

const typedValue = computed(() => (typed.value === '' ? null : Number(typed.value)))
const typedValid = computed(
  () => !!props.category && typedValue.value !== null && isValidScore(props.category, typedValue.value),
)

function press(d: string) {
  if (typed.value.length >= 2) return
  typed.value = typed.value === '0' ? d : typed.value + d
}

function save(value: number) {
  emit('save', value, offerBonus.value && bonus.value)
  open.value = false
}
</script>

<template>
  <Modal v-model="open" :title="info?.label" :description="info?.help">
    <div v-if="info" class="flex flex-col gap-4">
      <p class="text-muted-foreground -mt-2 text-sm">
        {{ playerName }}<template v-if="current !== null"> · fixing a {{ current }}</template>
      </p>

      <!-- Upper: how many of that face -->
      <div v-if="info.kind === 'upper'" class="grid grid-cols-3 gap-2">
        <button
          v-for="opt in upperOptions"
          :key="opt.count"
          type="button"
          class="bg-card flex h-20 flex-col items-center justify-center rounded-xl border-2 transition-colors active:scale-[0.97]"
          @click="save(opt.value)"
        >
          <span class="text-2xl font-bold tabular-nums">{{ opt.value }}</span>
          <span class="text-muted-foreground text-xs">{{ opt.count }}× {{ info.face }}</span>
        </button>
      </div>

      <!-- Fixed: score it or scratch it -->
      <div v-else-if="info.kind === 'fixed'" class="grid grid-cols-2 gap-2">
        <Button size="xl" class="h-20 text-2xl" @click="save(info.fixed!)">{{ info.fixed }}</Button>
        <Button size="xl" variant="outline" class="h-20 text-lg" @click="save(0)">Scratch 0</Button>
      </div>

      <!-- Sum: total of the dice -->
      <div v-else class="flex flex-col gap-3">
        <div class="flex h-16 items-center justify-center rounded-xl border-2 text-4xl font-bold tabular-nums">
          <span v-if="typed">{{ typed }}</span>
          <span v-else class="text-muted-foreground text-base font-normal">Total of all five dice</span>
        </div>
        <div class="grid grid-cols-3 gap-2">
          <button
            v-for="d in ['1', '2', '3', '4', '5', '6', '7', '8', '9']"
            :key="d"
            type="button"
            class="bg-secondary h-14 rounded-xl text-2xl font-semibold active:scale-[0.97]"
            @click="press(d)"
          >{{ d }}</button>
          <button
            type="button"
            class="bg-secondary text-muted-foreground h-14 rounded-xl text-sm font-medium"
            @click="save(0)"
          >Scratch 0</button>
          <button
            type="button"
            class="bg-secondary h-14 rounded-xl text-2xl font-semibold active:scale-[0.97]"
            @click="press('0')"
          >0</button>
          <button
            type="button"
            class="bg-secondary grid h-14 place-items-center rounded-xl"
            aria-label="Delete"
            @click="typed = typed.slice(0, -1)"
          ><Delete class="size-6" /></button>
        </div>
        <p v-if="typed && !typedValid" class="text-primary text-center text-sm">
          Five dice add up to {{ SUM_MIN }}–{{ SUM_MAX }}.
        </p>
        <Button size="xl" :disabled="!typedValid" @click="save(typedValue!)">Save {{ typed }}</Button>
      </div>

      <!-- Yahtzee bonus -->
      <div v-if="offerBonus" class="rounded-xl border-2 p-3" :class="bonus ? 'border-highlight bg-highlight/20' : ''">
        <div class="flex items-center gap-3">
          <label class="flex flex-1 items-center gap-3 font-semibold">
            <input v-model="bonus" type="checkbox" class="accent-primary size-6">
            Bonus Yahtzee (+100)
          </label>
          <button
            type="button"
            class="text-muted-foreground grid size-9 place-items-center rounded-lg"
            aria-label="What is the Yahtzee bonus?"
            @click="showBonusHelp = !showBonusHelp"
          ><Info class="size-5" /></button>
        </div>
        <p v-if="showBonusHelp" class="text-muted-foreground mt-2 text-sm">{{ YAHTZEE_BONUS_HELP }}</p>
      </div>
    </div>
  </Modal>
</template>

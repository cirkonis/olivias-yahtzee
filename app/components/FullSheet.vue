<script setup lang="ts">
import {
  CATEGORY_INFO,
  LOWER,
  UPPER,
  bonusState,
  grandTotal,
  parIndex,
  upperBonus,
  upperSubtotal,
  yahtzeeBonusTotal,
  type GameState,
} from '~~/shared/yahtzee'
import { signed } from '~/lib/utils'

const open = defineModel<boolean>({ required: true })

const props = defineProps<{ game: GameState }>()
const emit = defineEmits<{ pick: [player: number] }>()

function pick(i: number) {
  emit('pick', i)
  open.value = false
}

const cell = (v: number | null) => (v === null ? '' : String(v))

function bonusCell(i: number) {
  const card = props.game.cards[i]!
  const state = bonusState(card)
  if (state === 'secured') return String(upperBonus(card))
  if (state === 'lost') return '0'
  return signed(parIndex(card))
}
</script>

<template>
  <Modal v-model="open" title="Score sheet">
    <div class="-mx-5 overflow-x-auto">
      <table class="w-full border-collapse text-sm tabular-nums">
        <thead>
          <tr>
            <th class="bg-card sticky left-0 w-16" />
            <th
              v-for="(p, i) in game.players"
              :key="i"
              class="max-w-16 truncate px-1 py-2 text-xs font-bold"
              :class="i === game.current ? 'bg-primary text-primary-foreground' : ''"
              @click="pick(i)"
            >{{ p.name }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in UPPER" :key="c" class="border-t">
            <th class="bg-card sticky left-0 py-1.5 pl-5 text-left font-medium">{{ CATEGORY_INFO[c].short }}</th>
            <td v-for="(card, i) in game.cards" :key="i" class="text-center" :class="i === game.current ? 'bg-accent' : ''">
              {{ cell(card.scores[c]) }}
            </td>
          </tr>
          <tr class="bg-secondary border-t font-semibold">
            <th class="bg-secondary sticky left-0 py-1.5 pl-5 text-left">Upper</th>
            <td v-for="(card, i) in game.cards" :key="i" class="text-center">{{ upperSubtotal(card) }}</td>
          </tr>
          <tr class="border-t">
            <th class="bg-card sticky left-0 py-1.5 pl-5 text-left font-medium">Bonus</th>
            <td v-for="(_, i) in game.cards" :key="i" class="text-center" :class="i === game.current ? 'bg-accent' : ''">
              {{ bonusCell(i) }}
            </td>
          </tr>
          <tr v-for="c in LOWER" :key="c" class="border-t" :class="c === 'threeKind' ? 'border-t-foreground border-t-2' : ''">
            <th class="bg-card sticky left-0 py-1.5 pl-5 text-left font-medium">{{ CATEGORY_INFO[c].short }}</th>
            <td v-for="(card, i) in game.cards" :key="i" class="text-center" :class="i === game.current ? 'bg-accent' : ''">
              {{ cell(card.scores[c]) }}
            </td>
          </tr>
          <tr class="border-t">
            <th class="bg-card sticky left-0 py-1.5 pl-5 text-left font-medium">YZ+</th>
            <td v-for="(card, i) in game.cards" :key="i" class="text-center" :class="i === game.current ? 'bg-accent' : ''">
              {{ card.yahtzeeBonus ? yahtzeeBonusTotal(card) : '' }}
            </td>
          </tr>
          <tr class="bg-foreground text-background border-t text-base font-bold">
            <th class="bg-foreground sticky left-0 py-2 pl-5 text-left">Total</th>
            <td v-for="(card, i) in game.cards" :key="i" class="text-center">{{ grandTotal(card) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p class="text-muted-foreground mt-3 text-xs">Tap a name to jump to their card.</p>
  </Modal>
</template>

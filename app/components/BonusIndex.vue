<script setup lang="ts">
import { Check } from 'lucide-vue-next'
import { bonusState, parIndex, type Card } from '~~/shared/yahtzee'
import { cn, signed } from '~/lib/utils'

const props = defineProps<{ card: Card; class?: string }>()

const state = computed(() => bonusState(props.card))
const index = computed(() => parIndex(props.card))
</script>

<template>
  <span
    :class="cn(
      'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-sm font-bold tabular-nums',
      state === 'secured' && 'bg-highlight text-highlight-foreground',
      state === 'lost' && 'bg-muted text-muted-foreground line-through',
      state === 'chasing' && index >= 0 && 'bg-foreground text-background',
      state === 'chasing' && index < 0 && 'bg-primary text-primary-foreground',
      props.class,
    )"
  >
    <template v-if="state === 'secured'"><Check class="size-3.5" /> 35</template>
    <template v-else>{{ signed(index) }}</template>
  </span>
</template>

<script setup lang="ts">
import { cn } from '~/lib/utils'

const props = defineProps<{ class?: string }>()
</script>

<template>
  <div data-slot="card-header" :class="cn('flex items-center justify-between gap-3 px-4 py-3', props.class)">
    <slot />
  </div>
</template>

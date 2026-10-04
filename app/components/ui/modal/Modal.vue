<script setup lang="ts">
import { X } from 'lucide-vue-next'

const open = defineModel<boolean>({ required: true })

const props = withDefaults(
  defineProps<{
    title?: string
    description?: string
    /** Hide the built-in header when the content supplies its own. */
    bare?: boolean
  }>(),
  { bare: false },
)

function close() {
  open.value = false
}

// Escape to dismiss, and keep the page behind from scrolling while open.
onMounted(() => {
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && open.value) close()
  }
  window.addEventListener('keydown', onKey)
  onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
})

watch(open, (v) => {
  if (import.meta.client) document.body.style.overflow = v ? 'hidden' : ''
})

onBeforeUnmount(() => {
  if (import.meta.client) document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0"
      leave-active-class="transition duration-150 ease-in"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 backdrop-blur-[2px] sm:items-center"
        @click.self="close"
      >
        <Transition
          appear
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="translate-y-6 opacity-0 sm:translate-y-0 sm:scale-95"
          leave-active-class="transition duration-150 ease-in"
          leave-to-class="translate-y-6 opacity-0 sm:translate-y-0 sm:scale-95"
        >
          <div
            v-if="open"
            role="dialog"
            aria-modal="true"
            class="bg-card text-card-foreground max-h-[90dvh] w-full overflow-y-auto rounded-t-2xl border shadow-xl sm:max-w-md sm:rounded-2xl"
            style="padding-bottom: env(safe-area-inset-bottom)"
          >
            <div v-if="!props.bare" class="flex items-start justify-between gap-3 px-5 pt-5">
              <div class="min-w-0">
                <h3 class="text-lg leading-tight font-semibold">{{ props.title }}</h3>
                <p v-if="props.description" class="text-muted-foreground mt-1 text-sm">
                  {{ props.description }}
                </p>
              </div>
              <button
                type="button"
                class="text-muted-foreground hover:bg-secondary hover:text-foreground -mr-1 -mt-1 grid size-8 shrink-0 place-items-center rounded-lg transition-colors"
                aria-label="Close"
                @click="close"
              >
                <X class="size-4" />
              </button>
            </div>
            <div :class="props.bare ? '' : 'px-5 pt-4 pb-5'">
              <slot :close="close" />
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

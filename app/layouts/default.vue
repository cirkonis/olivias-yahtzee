<template>
  <div class="min-h-dvh bg-background text-foreground antialiased">
    <header class="bg-primary text-primary-foreground" style="padding-top: env(safe-area-inset-top)">
      <div class="mx-auto flex h-14 max-w-lg items-center px-4">
        <NuxtLink to="/" class="text-xl font-black tracking-tight italic">Olivia's Yahtzee</NuxtLink>
      </div>
    </header>
    <main class="mx-auto max-w-lg px-4 pt-5 pb-10">
      <slot />
    </main>
  </div>
</template>

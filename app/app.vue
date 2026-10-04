<script setup lang="ts">
useHead({
  titleTemplate: (title) => (title ? `${title} · Olivia's Yahtzee` : "Olivia's Yahtzee"),
  meta: [
    {
      name: 'viewport',
      content:
        'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover',
    },
    { name: 'theme-color', content: '#d6202a' },
  ],
  link: [{ rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' }],
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
useHead({
  titleTemplate: (title) => (title ? `${title} · Olivia's Yahtzee` : "Olivia's Yahtzee"),
  htmlAttrs: { lang: 'en' },
  meta: [
    {
      name: 'viewport',
      content:
        'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover',
    },
    { name: 'theme-color', content: '#d6202a' },
    // Add to Home Screen: open full-screen, red bar behind the status icons.
    { name: 'apple-mobile-web-app-capable', content: 'yes' },
    { name: 'mobile-web-app-capable', content: 'yes' },
    { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
    { name: 'apple-mobile-web-app-title', content: 'Yahtzee' },
  ],
  link: [
    { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
    { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
    { rel: 'manifest', href: '/manifest.webmanifest' },
  ],
  script: [
    {
      // Follow the phone's light/dark setting, set before first paint so there's no flash.
      innerHTML:
        "(function(){var m=matchMedia('(prefers-color-scheme: dark)');" +
        "function s(){document.documentElement.classList.toggle('dark',m.matches)}" +
        "s();m.addEventListener('change',s)})()",
      tagPosition: 'head',
    },
  ],
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

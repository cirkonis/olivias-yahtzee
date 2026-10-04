<script setup lang="ts">
definePageMeta({ layout: 'blank' })
useHead({ title: 'Sign in' })

const password = ref('')
const error = ref<string | null>(null)
const loading = ref(false)
const route = useRoute()
const { fetch: refreshSession } = useUserSession()

async function onSubmit() {
  error.value = null
  loading.value = true
  try {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: { password: password.value },
    })
    // Pull the new session into the client-side composable so the global
    // middleware sees loggedIn=true before navigateTo runs.
    await refreshSession()
    const redirect = (route.query.redirect as string | undefined) || '/'
    await navigateTo(redirect)
  } catch {
    error.value = 'Incorrect password'
    password.value = ''
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="bg-primary flex min-h-dvh items-center justify-center px-4">
    <Card class="w-full max-w-sm p-6">
      <div class="mb-5">
        <h1 class="text-primary text-3xl font-black tracking-tight italic">Olivia's Yahtzee</h1>
        <p class="text-muted-foreground mt-1 text-sm">Sign in to keep games and series.</p>
      </div>
      <form class="flex flex-col gap-4" @submit.prevent="onSubmit">
        <div class="flex flex-col gap-2">
          <Label for="password">Password</Label>
          <Input
            id="password"
            v-model="password"
            type="password"
            autocomplete="current-password"
            :disabled="loading"
            autofocus
          />
        </div>
        <p v-if="error" class="text-destructive text-sm">{{ error }}</p>
        <Button type="submit" size="lg" :disabled="loading || !password.length">
          {{ loading ? 'Checking…' : 'Sign in' }}
        </Button>
        <NuxtLink to="/open" class="text-muted-foreground text-center text-sm underline-offset-4 hover:underline">
          Just keep score without saving
        </NuxtLink>
      </form>
    </Card>
  </div>
</template>

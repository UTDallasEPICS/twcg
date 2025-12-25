<script setup lang="ts">
  import type { NavigationMenuItem } from '@nuxt/ui'
  import { authClient } from './utils/auth-client'

  const route = useRoute()
  const { data: session } = await authClient.useSession(useFetch)

  const items = computed<NavigationMenuItem[]>(() => {
    const role = session.value?.user?.role

    if (role === 'ADMIN') {
      return [
        {
          label: 'Departments',
          to: '/departments',
          icon: 'i-lucide-building-2',
        },
      ]
    }

    return []
  })

  async function handleLogout() {
    try {
      await authClient.signOut()
    } finally {
      window.location.href = '/auth'
    }
  }

  const userMenuItems = computed(() => {
    const items = []
    items.push({
      label: 'Logout',
      icon: 'i-lucide-log-out',
      onSelect: handleLogout,
    })
    return [items]
  })
</script>

<template>
  <UApp>
    <UHeader v-if="route.path !== '/auth'">
      <UNavigationMenu :items="items" variant="pill" />

      <template #title>
        <div class="flex items-center justify-center space-x-2">
          <img src="./assets/images/logo.svg" class="w-28" />
          <p class="hidden md:block">TWCGateway</p>
        </div>
      </template>

      <template #right>
        <UColorModeButton />
        <UDropdownMenu :items="userMenuItems" :content="{ align: 'end' }">
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-user"
            :label="session?.user?.name.split(' ')[0] || 'User'"
          />
        </UDropdownMenu>
      </template>

      <template #body>
        <UNavigationMenu :items="items" orientation="vertical" class="-mx-2.5" />
      </template>
    </UHeader>

    <UMain>
      <NuxtPage />
    </UMain>
  </UApp>
</template>

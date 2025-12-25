<script setup lang="ts">
  import type { TableColumn } from '@nuxt/ui'
  import { refDebounced } from '@vueuse/core'
  import { h, resolveComponent } from 'vue'
  import { authClient } from '~/utils/auth-client'

  const route = useRoute()
  const userId = route.params.id as string
  const UCheckbox = resolveComponent('UCheckbox')

  // Fetch Current Session
  const { data: session } = await authClient.useSession(useFetch)
  const isOnboardingUser = computed(() => session.value?.user?.role === 'ONBOARDING')

  // Fetch User Info
  const { data: user } = await useFetch(`/api/get/users/byId/${userId}`)

  // Fetch Categories
  const { data: categories } = await useFetch(
    `/api/get/users/${userId}/task-categories`
  )

  // State
  const page = ref(1)
  const limit = ref(5)
  const search = ref('')
  const debouncedSearch = refDebounced(search, 500)
  const activeTab = ref('')

  // Fetch Tasks
  const { data: onboardingTasks, status, refresh } = await useFetch(
    `/api/get/users/${userId}/onboarding-tasks`
  )

  // Tabs
  const items = computed(() => {
    return (categories.value || []).map((cat: string) => ({
      label: cat,
      value: cat,
    }))
  })

  watch(
    items,
    (tabs) => {
      if (tabs.length && !activeTab.value) {
        activeTab.value = tabs[0].value
      }
    },
    { immediate: true }
  )

  watch([activeTab, debouncedSearch], () => {
    page.value = 1
  })

  // Filtered Data (Client side search/pagination for now as it's a small list per user, but let's make it consistent)
  const filteredData = computed(() => {
    let data = (onboardingTasks.value || []).filter(
      (ot) => ot.task.category === activeTab.value
    )
    
    if (search.value) {
      data = data.filter(ot => ot.task.desc.toLowerCase().includes(search.value.toLowerCase()))
    }
    
    return data
  })

  // Since we are doing client side filtering for this specific view (total user tasks is usually small), 
  // we manually slice for pagination in the computed.
  const paginatedData = computed(() => {
    const start = (page.value - 1) * limit.value
    return filteredData.value.slice(start, start + limit.value)
  })

    const columns: TableColumn<any>[] = [
      {
        accessorKey: 'completed',
        header: 'Status',
        cell: ({ row }) => {
          return h('div', { class: 'flex items-center gap-2' }, [
            h(UCheckbox, {
              modelValue: row.original.completed,
              disabled: isOnboardingUser.value,
              'onUpdate:modelValue': (val: boolean) => toggleStatus(row.original, val),
            }),
            h('span', {
              class: ['text-xs font-medium', row.original.completed ? 'text-green-600' : 'text-gray-500']
            }, row.original.completed ? 'Completed' : 'Pending')
          ])
        }
      },
      {
        accessorKey: 'task.desc',
        header: 'Task',
      },
      {
        accessorKey: 'task.supervisor.name',
        header: 'Supervisor',
        cell: ({ row }) => row.original.task.supervisor?.name || 'Unassigned',
      },
    ]
  
    async function toggleStatus(row: any, checked: boolean) {
      try {
        await $fetch(`/api/put/onboarding-tasks/${row.id}`, {
          method: 'PUT',
          body: { completed: checked },
        })
        await refresh()
      } catch (e) {
        console.error(e)
      }
    }
  </script>
<template>
  <div class="flex flex-col gap-6 p-6">
    <div class="flex items-center gap-4">
      <UButton
        v-if="!isOnboardingUser"
        icon="i-heroicons-arrow-left"
        color="neutral"
        variant="ghost"
        to="/"
      />
      <div>
        <h1 v-if="!isOnboardingUser" class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ user?.name }}
        </h1>
      </div>
    </div>

    <div v-if="items.length" class="flex flex-col gap-4">
      <UTabs v-model="activeTab" :items="items" class="w-full" />

      <Table
        v-model:page="page"
        v-model:items-per-page="limit"
        v-model:search="search"
        :columns="columns"
        :data="paginatedData"
        :total="filteredData.length"
        :loading="status === 'pending'"
      />
    </div>    <div v-else-if="status !== 'pending'" class="py-10 text-center">
      <p class="text-gray-500 dark:text-gray-400">
        No onboarding tasks found for this user.
      </p>
    </div>
  </div>
</template>
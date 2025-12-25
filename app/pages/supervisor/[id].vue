<script setup lang="ts">
  import type { TableColumn } from '@nuxt/ui'

  const route = useRoute()
  const userId = route.params.id as string

  // Fetch User Info
  const { data: user } = await useFetch(`/api/get/users/byId/${userId}`)

  // Fetch Supervising Tasks
  const { data: supervisingTasks, status } = await useFetch(
    `/api/get/users/${userId}/supervising-tasks`
  )

  // Tabs (Departments)
  const activeTab = ref('')
  const items = computed(() => {
    if (!supervisingTasks.value) return []
    const depts = new Set(
      supervisingTasks.value.map((t) => t.department?.name).filter(Boolean)
    )
    return Array.from(depts).map((d) => ({ label: d, value: d }))
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

  // Filtered Data
  const filteredData = computed(() => {
    return (supervisingTasks.value || []).filter(
      (t) => t.department?.name === activeTab.value
    )
  })

  const columns: TableColumn<any>[] = [
    { accessorKey: 'desc', header: 'Task Description' },
    { accessorKey: 'category', header: 'Category' },
  ]
</script>

<template>
  <div class="flex flex-col gap-6 p-6">
    <div class="flex items-center gap-4">
      <UButton
        icon="i-heroicons-arrow-left"
        color="neutral"
        variant="ghost"
        to="/"
      />
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ user?.name }}
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          {{ user?.role }} • {{ user?.department?.name || 'No Department' }}
        </p>
      </div>
    </div>

    <div v-if="items.length" class="flex flex-col gap-4">
      <UTabs v-model="activeTab" :items="items" class="w-full" />

      <Table :columns="columns" :data="filteredData" :loading="status === 'pending'" />
    </div>
    <div v-else-if="status !== 'pending'" class="py-10 text-center">
      <p class="text-gray-500 dark:text-gray-400">
        No supervising tasks found for this user.
      </p>
    </div>
  </div>
</template>

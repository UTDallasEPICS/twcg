<script setup lang="ts">
  import type { TableColumn } from '@nuxt/ui'
  import { refDebounced } from '@vueuse/core'

  const items = [
    { label: 'Onboarding', value: 'ONBOARDING' },
    { label: 'Supervisors', value: 'SUPERVISOR' },
    { label: 'Admins', value: 'ADMIN' },
  ]

  const activeTab = ref('ONBOARDING')
  const page = ref(1)
  const limit = ref(5)
  const search = ref('')
  const debouncedSearch = refDebounced(search, 500)

  const { data: usersData, status } = await useFetch('/api/get/users', {
    query: {
      page,
      limit,
      search: debouncedSearch,
      role: activeTab,
    },
    watch: [page, limit, debouncedSearch, activeTab],
  })

  // Reset page when tab or search changes
  watch([activeTab, debouncedSearch], () => {
    page.value = 1
  })

  const columns: TableColumn<any>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
    },
    {
      accessorKey: 'email',
      header: 'Email',
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
      cell: ({ row }) => row.original.phone || 'N/A',
    },
    {
      accessorKey: 'department.name',
      header: 'Department',
      cell: ({ row }) => row.original.department?.name || 'Unassigned',
    },
  ]
</script>

<template>
  <div class="flex flex-col gap-4 p-4">
    <UTabs v-model="activeTab" :items="items" class="w-full" />

    <Table
      v-model:page="page"
      v-model:items-per-page="limit"
      v-model:search="search"
      :columns="columns"
      :data="usersData?.data || []"
      :total="usersData?.total || 0"
      :loading="status === 'pending'"
    />
  </div>
</template>
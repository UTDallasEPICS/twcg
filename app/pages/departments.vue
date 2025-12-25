<script setup lang="ts">
  import type { TableColumn, ContextMenuItem } from '@nuxt/ui'
  import { UButton, UDropdownMenu } from '#components'

  const toast = useToast()
  const page = ref(1)
  const limit = 5

  const { data: deps, status } = await useFetch('/api/get/departments', {
    query: {
      page,
      limit,
    },
    watch: [page],
  })

  if (status.value === 'error') {
    toast.add({
      title: 'Unable to load departments',
      color: 'error',
    })
  }

  function getActions(row: any): ContextMenuItem[][] {
    return [
      [
        {
          label: 'Edit',
          icon: 'i-heroicons-pencil',
          onSelect: () => {
            toast.add({
              title: `Edit department: ${row.name}`,
              color: 'info',
            })
          },
        },
      ],
    ]
  }

  const columns: TableColumn<any>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
    },
    {
      id: 'users',
      header: 'Employees',
      cell: ({ row }) => {
        return row.original.users?.length || 0
      },
    },
  ]
</script>

<template>
  <div class="flex w-full items-center justify-center">
    <div class="w-full md:mt-5 md:w-3/4">
      <Table
        v-model:page="page"
        :columns="columns"
        :data="deps?.data || []"
        :loading="status === 'pending'"
        :total="deps?.total || 0"
        :items-per-page="limit"
        :row-menu-items="getActions"
        :class="'md:rounded-lg md:border'"
      />
    </div>
  </div>
</template>

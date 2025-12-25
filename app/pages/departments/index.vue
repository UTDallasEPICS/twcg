<script setup lang="ts">
  import type { TableColumn, ContextMenuItem } from '@nuxt/ui'
  import { z } from 'zod'
  import type { Field } from '~/components/FormModal.vue'
  import { refDebounced } from '@vueuse/core'

  const toast = useToast()
  const page = ref(1)
  const limit = ref(5)
  const search = ref('')
  const debouncedSearch = refDebounced(search, 500)

  const {
    data: deps,
    status,
    refresh,
  } = await useFetch('/api/get/departments', {
    query: {
      page,
      limit,
      search: debouncedSearch,
    },
    watch: [page, limit, debouncedSearch],
  })

  watch(debouncedSearch, () => {
    page.value = 1
  })

  if (status.value === 'error') {
    toast.add({
      title: 'Unable to load departments',
      color: 'error',
    })
  }

  // Edit Modal State
  const isModalOpen = ref(false)
  const selectedId = ref<string | null>(null)
  const formState = reactive({
    name: '',
  })

  const departmentSchema = z.object({
    name: z.string().min(1, 'Name is required'),
  })

  const fields: Field[] = [{ name: 'name', label: 'Department Name' }]

  async function handleUpdate(data: typeof formState) {
    try {
      await $fetch(`/api/put/departments/${selectedId.value}`, {
        method: 'PUT',
        body: data,
      })
      toast.add({
        title: 'Department updated successfully',
        color: 'success',
      })
      await refresh()
    } catch (error) {
      toast.add({
        title: 'Failed to update department',
        color: 'error',
      })
      throw error
    }
  }

  function getActions(row: any): ContextMenuItem[][] {
    return [
      [
        {
          label: 'Edit',
          icon: 'i-heroicons-pencil',
          onSelect: () => {
            selectedId.value = row.id
            formState.name = row.name
            isModalOpen.value = true
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

  function handleRowClick(_event: any, row: any) {
    console.log('Row clicked:', row)
    console.log('Target ID:', row.original?.id)
    if (row.original?.id) {
      navigateTo(`/departments/${row.original.id}`)
    } else {
      console.error('No ID found in row data')
    }
  }
</script>

<template>
  <div class="p-4">
    <Table
      v-model:page="page"
      v-model:search="search"
      v-model:items-per-page="limit"
      :columns="columns"
      :data="deps?.data || []"
      :loading="status === 'pending'"
      :total="deps?.total || 0"
      :row-menu-items="getActions"
      @select="handleRowClick"
    />

    <FormModal
      v-model="isModalOpen"
      title="Edit Department"
      :schema="departmentSchema"
      :state="formState"
      :fields="fields"
      :on-submit="handleUpdate"
    />
  </div>
</template>

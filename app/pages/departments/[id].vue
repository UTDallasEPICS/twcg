<script setup lang="ts">
  import type { TableColumn, ContextMenuItem } from '@nuxt/ui'
  import { z } from 'zod'
  import type { Field } from '~/components/FormModal.vue'
  import { refDebounced } from '@vueuse/core'

  const route = useRoute()
  const toast = useToast()
  const deptId = route.params.id as string

  // Fetch Department Info
  const { data: department, error: deptError } = await useFetch(
    `/api/get/departments/${deptId}`
  )

  if (deptError.value) {
    toast.add({
      title: 'Unable to load department details',
      color: 'error',
    })
  }

  // Tasks Table State
  const page = ref(1)
  const limit = ref(5)
  const search = ref('')
  const debouncedSearch = refDebounced(search, 500)

  const {
    data: tasksData,
    status,
    refresh,
  } = await useFetch(`/api/get/departments/${deptId}/tasks`, {
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

  // Edit Modal State
  const isModalOpen = ref(false)
  const selectedTaskId = ref<string | null>(null)
  const formState = reactive({
    desc: '',
  })

  const taskSchema = z.object({
    desc: z.string().min(1, 'Description is required'),
  })

  const fields: Field[] = [{ name: 'desc', label: 'Task Description' }]

  async function handleUpdate(data: typeof formState) {
    try {
      await $fetch(`/api/put/tasks/${selectedTaskId.value}`, {
        method: 'PUT',
        body: data,
      })
      toast.add({
        title: 'Task updated successfully',
        color: 'success',
      })
      await refresh()
    } catch (error) {
      toast.add({
        title: 'Failed to update task',
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
            selectedTaskId.value = row.id
            formState.desc = row.desc
            isModalOpen.value = true
          },
        },
      ],
    ]
  }

  const columns: TableColumn<any>[] = [
    {
      accessorKey: 'desc',
      header: 'Description',
    },
  ]
</script>

<template>
  <div class="flex flex-col gap-4 p-4">
    <div class="flex items-center gap-4">
      <UButton
        icon="i-heroicons-arrow-left"
        color="gray"
        variant="ghost"
        to="/departments"
      />
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        {{ department?.name || 'Department Details' }}
      </h1>
    </div>

    <div>
      <h2 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
        Tasks
      </h2>
      <Table
        v-model:page="page"
        v-model:search="search"
        v-model:items-per-page="limit"
        :columns="columns"
        :data="tasksData?.data || []"
        :loading="status === 'pending'"
        :total="tasksData?.total || 0"
        :row-menu-items="getActions"
      />
    </div>

    <FormModal
      v-model="isModalOpen"
      title="Edit Task"
      :schema="taskSchema"
      :state="formState"
      :fields="fields"
      :on-submit="handleUpdate"
    />
  </div>
</template>

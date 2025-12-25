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

  // Categories State
  const { data: categories, refresh: refreshCategories } = await useFetch(
    `/api/get/departments/${deptId}/task-categories`
  )

  const localCategories = ref<string[]>([])
  const activeCategory = ref('')

  watch(
    categories,
    (newVal) => {
      localCategories.value = [...(newVal || [])]
      // Set initial category
      if (newVal?.length && !activeCategory.value) {
        activeCategory.value = newVal[0]
      }
    },
    { immediate: true }
  )

  function onCreateCategory(newItem: string) {
    localCategories.value.push(newItem)
    formState.category = newItem
  }

  const tabItems = computed(() => {
    return (categories.value || []).map((cat: string) => ({
      label: cat,
      value: cat,
    }))
  })


  // Supervisors for Assignment
  const { data: supervisors } = await useFetch('/api/get/users', {
    query: { role: 'SUPERVISOR', limit: 100 }
  })

  // Tasks Table State
  const page = ref(1)
  const limit = ref(5)
  const search = ref('')
  const debouncedSearch = refDebounced(search, 500)

  const {
    data: tasksData,
    status,
    refresh: refreshTasks,
  } = await useFetch(`/api/get/departments/${deptId}/tasks`, {
    query: {
      page,
      limit,
      search: debouncedSearch,
      category: activeCategory,
    },
    watch: [page, limit, debouncedSearch, activeCategory],
  })

  watch([activeCategory, debouncedSearch], () => {
    page.value = 1
  })

  // Edit Modal State
  const isModalOpen = ref(false)
  const selectedTaskId = ref<string | null>(null)
  const formState = reactive({
    desc: '',
    category: '',
    supervisorId: null as string | null,
  })

  const taskSchema = z.object({
    desc: z.string().min(1, 'Description is required'),
    category: z.string().min(1, 'Category is required'),
    supervisorId: z.string().nullable().optional(),
  })

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
      await Promise.all([refreshTasks(), refreshCategories()])
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
            formState.category = row.category
            formState.supervisorId = row.supervisorId || null
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
    {
      accessorKey: 'supervisor.name',
      header: 'Assigned To',
      cell: ({ row }) => row.original.supervisor?.name || 'Unassigned',
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

    <div v-if="tabItems.length" class="flex flex-col gap-4">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Tasks</h2>
      <UTabs v-model="activeCategory" :items="tabItems" class="w-full" />

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
    <div v-else-if="status !== 'pending'" class="py-10 text-center">
      <p class="text-gray-500 dark:text-gray-400">
        No tasks found for this department.
      </p>
    </div>

    <FormModal
      v-model="isModalOpen"
      title="Edit Task"
      :schema="taskSchema"
      :state="formState"
      :on-submit="handleUpdate"
    >
      <UFormField label="Description" name="desc">
        <UTextarea v-model="formState.desc" class="w-full" />
      </UFormField>
      <UFormField label="Category" name="category">
        <UInputMenu
          v-model="formState.category"
          :items="localCategories"
          create-item
          class="w-full"
          @create="onCreateCategory"
        />
      </UFormField>
      <UFormField label="Supervisor" name="supervisorId">
        <USelectMenu
          v-model="formState.supervisorId"
          :items="supervisors?.data || []"
          value-key="id"
          label-key="name"
          class="w-full"
          placeholder="Select Supervisor"
        />
      </UFormField>
    </FormModal>
  </div>
</template>

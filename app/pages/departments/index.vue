<script setup lang="ts">
  import type { TableColumn, ContextMenuItem } from '@nuxt/ui'
  import { z } from 'zod'
  import type { Field } from '~/components/FormModal.vue'
  import { refDebounced } from '@vueuse/core'
  import { authClient } from '~/utils/auth-client'

  const toast = useToast()
  const page = ref(1)
  const limit = ref(5)
  const search = ref('')
  const debouncedSearch = refDebounced(search, 500)

  // Fetch Session
  const { data: session } = await authClient.useSession(useFetch)
  const isAdmin = computed(() => session.value?.user?.role === 'ADMIN')

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

  function openCreateModal() {
    selectedId.value = null
    formState.name = ''
    isModalOpen.value = true
  }

  async function handleSubmit(data: typeof formState) {
    try {
      if (selectedId.value) {
        await $fetch(`/api/put/departments/${selectedId.value}`, {
          method: 'PUT',
          body: data,
        })
        toast.add({
          title: 'Department updated successfully',
          color: 'success',
        })
      } else {
        await $fetch('/api/post/departments', {
          method: 'POST',
          body: data,
        })
        toast.add({
          title: 'Department created successfully',
          color: 'success',
        })
      }
      isModalOpen.value = false
      await refresh()
    } catch (error) {
      toast.add({
        title: selectedId.value ? 'Failed to update department' : 'Failed to create department',
        color: 'error',
      })
      throw error
    }
  }

  // Delete Modal State
  const isDeleteModalOpen = ref(false)
  const deptToDelete = ref<any>(null)

  function confirmDelete(row: any) {
    deptToDelete.value = row
    isDeleteModalOpen.value = true
  }

  async function handleDelete() {
    if (!deptToDelete.value) return
    try {
      await $fetch(`/api/delete/departments/${deptToDelete.value.id}`, {
        method: 'DELETE',
      })
      toast.add({
        title: 'Department deleted successfully',
        color: 'success',
      })
      await refresh()
    } catch (error) {
      toast.add({
        title: 'Failed to delete department',
        color: 'error',
      })
    }
  }

  function getActions(row: any): ContextMenuItem[][] {
    const actions: ContextMenuItem[] = [
      {
        label: 'Edit',
        icon: 'i-heroicons-pencil',
        onSelect: () => {
          selectedId.value = row.id
          formState.name = row.name
          isModalOpen.value = true
        },
      },
    ]

    if (isAdmin.value) {
      actions.push({
        label: 'Delete',
        icon: 'i-heroicons-trash',
        color: 'error',
        onSelect: () => confirmDelete(row),
      })
    }

    return [actions]
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
      :row-menu-items="isAdmin ? getActions : undefined"
      @select="handleRowClick"
    >
      <template #header-actions>
        <UButton
          v-if="isAdmin"
          icon="i-heroicons-plus"
          color="primary"
          variant="solid"
          @click="openCreateModal"
        />
      </template>
    </Table>

    <FormModal
      v-model="isModalOpen"
      :title="selectedId ? 'Edit Department' : 'Create Department'"
      :schema="departmentSchema"
      :state="formState"
      :fields="fields"
      :on-submit="handleSubmit"
    />
    <!-- Delete Modal -->
    <DeleteModal
      v-model="isDeleteModalOpen"
      title="Delete Department"
      :description="`Are you sure you want to delete ${deptToDelete?.name}? All associated tasks and assignments will be removed.`"
      :on-confirm="handleDelete"
    />
  </div>
</template>

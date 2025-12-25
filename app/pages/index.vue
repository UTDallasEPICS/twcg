<script setup lang="ts">
  import type { TableColumn, ContextMenuItem } from '@nuxt/ui'
  import { refDebounced } from '@vueuse/core'
  import { z } from 'zod'
  import type { Field } from '~/components/FormModal.vue'
  import { authClient } from '~/utils/auth-client'

  const toast = useToast()
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

  // Fetch Session
  const { data: session } = await authClient.useSession(useFetch)
  const isAdmin = computed(() => session.value?.user?.role === 'ADMIN')

  const {
    data: usersData,
    status,
    refresh,
  } = await useFetch('/api/get/users', {
    query: {
      page,
      limit,
      search: debouncedSearch,
      role: activeTab,
    },
    watch: [page, limit, debouncedSearch, activeTab],
  })

  // Reference Data for Edit Form
  const { data: allDepartments } = await useFetch('/api/get/departments/list')
  const { data: allTasks } = await useFetch('/api/get/tasks')

  // Reset page when tab or search changes
  watch([activeTab, debouncedSearch], () => {
    page.value = 1
  })

  // Edit Modal State
  const isEditModalOpen = ref(false)
  const isConfirmModalOpen = ref(false)
  const selectedUserId = ref<string | null>(null)
  const originalDeptId = ref<string | null>(null)

  const userFormState = reactive({
    name: '',
    email: '',
    phone: '',
    deptId: undefined as string | undefined,
    supervisingTaskIds: [] as string[],
  })

  const userSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email address'),
    phone: z.string().nullable().optional(),
    deptId: z.string().optional(),
    supervisingTaskIds: z.array(z.string()).optional(),
  })

  const userFields: Field[] = [
    { name: 'name', label: 'Name' },
    { name: 'email', label: 'Email', type: 'email' },
  ]

  // Watch phone state to format it
  watch(
    () => userFormState.phone,
    (newValue) => {
      const formatted = formatPhoneNumber(newValue)
      if (newValue !== formatted) {
        userFormState.phone = formatted
      }
    }
  )

  function openCreateModal() {
    selectedUserId.value = null
    userFormState.name = ''
    userFormState.email = ''
    userFormState.phone = ''
    userFormState.deptId = undefined
    userFormState.supervisingTaskIds = []
    originalDeptId.value = null
    isEditModalOpen.value = true
  }

  async function performSubmit() {
    try {
      const payload = {
        ...userFormState,
        phone: parsePhoneNumber(userFormState.phone),
        role: activeTab.value,
      }

      if (selectedUserId.value) {
        await $fetch(`/api/put/users/${selectedUserId.value}`, {
          method: 'PUT',
          body: payload,
        })
        toast.add({
          title: 'User updated successfully',
          color: 'success',
        })
      } else {
        await $fetch('/api/post/users', {
          method: 'POST',
          body: payload,
        })
        toast.add({
          title: 'User created successfully',
          color: 'success',
        })
      }
      isEditModalOpen.value = false
      isConfirmModalOpen.value = false
      await refresh()
    } catch (error: any) {
      toast.add({
        title: error.data?.statusMessage || (selectedUserId.value ? 'Failed to update user' : 'Failed to create user'),
        color: 'error',
      })
    }
  }

  async function handleSubmitUser() {
    // Check for Department Change warning only on update
    if (
      selectedUserId.value &&
      activeTab.value === 'ONBOARDING' &&
      userFormState.deptId !== originalDeptId.value
    ) {
      isConfirmModalOpen.value = true
      return
    }
    await performSubmit()
  }

  // Delete Modal State
  const isDeleteModalOpen = ref(false)
  const userToDelete = ref<any>(null)

  function confirmDelete(row: any) {
    userToDelete.value = row
    isDeleteModalOpen.value = true
  }

  async function handleDelete() {
    if (!userToDelete.value) return
    try {
      await $fetch(`/api/delete/users/${userToDelete.value.id}`, {
        method: 'DELETE',
      })
      toast.add({
        title: 'User deleted successfully',
        color: 'success',
      })
      await refresh()
    } catch (error) {
      toast.add({
        title: 'Failed to delete user',
        color: 'error',
      })
    }
  }

  function getUserActions(row: any): ContextMenuItem[][] {
    const actions: ContextMenuItem[] = [
      {
        label: 'Edit',
        icon: 'i-heroicons-pencil',
        onSelect: async () => {
          selectedUserId.value = row.id

          // Fetch full details to get relations
          const fullUser = await $fetch(`/api/get/users/byId/${row.id}`)

          let supervisedIds: string[] = []
          if (activeTab.value === 'SUPERVISOR') {
            const tasks = await $fetch(
              `/api/get/users/${row.id}/supervising-tasks`
            )
            supervisedIds = tasks.map((t: any) => t.id)
          }

          userFormState.name = fullUser.name
          userFormState.email = fullUser.email
          userFormState.phone = fullUser.phone || ''
          userFormState.deptId = fullUser.deptId || undefined
          userFormState.supervisingTaskIds = supervisedIds

          originalDeptId.value = fullUser.deptId
          isEditModalOpen.value = true
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

  const columns = computed<TableColumn<any>[]>(() => {
    const cols: TableColumn<any>[] = [
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
        cell: ({ row }) => formatPhoneNumber(row.original.phone) || 'N/A',
      },
    ]

    if (activeTab.value === 'ONBOARDING') {
      cols.push({
        accessorKey: 'department.name',
        header: 'Department',
        cell: ({ row }) => row.original.department?.name || 'Unassigned',
      })
    }

    return cols
  })

  function handleRowClick(_event: any, row: any) {
    if (row.original.role === 'ADMIN') return
    if (row.original.role === 'SUPERVISOR') {
      navigateTo(`/supervisor/${row.original.id}`)
    } else {
      navigateTo(`/onboarding/${row.original.id}`)
    }
  }
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
      :row-menu-items="isAdmin ? getUserActions : undefined"
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
      v-model="isEditModalOpen"
      :title="selectedUserId ? 'Edit User' : 'Create User'"
      :schema="userSchema"
      :state="userFormState"
      :fields="userFields"
      :on-submit="handleSubmitUser"
    >
      <UFormField label="Name" name="name">
        <UInput v-model="userFormState.name" class="w-full" />
      </UFormField>
      <UFormField label="Email" name="email">
        <UInput v-model="userFormState.email" type="email" class="w-full" />
      </UFormField>
      <UFormField label="Phone" name="phone">
        <UInput
          v-model="userFormState.phone"
          placeholder="(555) 555-5555"
          class="w-full"
        />
      </UFormField>

      <!-- Role Specific Fields -->
      <UFormField
        v-if="activeTab === 'ONBOARDING'"
        label="Department"
        name="deptId"
      >
        <USelectMenu
          v-model="userFormState.deptId"
          :items="allDepartments || []"
          value-key="id"
          label-key="name"
          class="w-full"
          placeholder="Select Department"
        />
      </UFormField>

      <UFormField
        v-if="activeTab === 'SUPERVISOR'"
        label="Supervised Tasks"
        name="supervisingTaskIds"
      >
        <TaskSelector
          v-model="userFormState.supervisingTaskIds"
          :tasks="allTasks || []"
        />
      </UFormField>
    </FormModal>

    <!-- Confirmation Modal -->
    <UModal v-model:open="isConfirmModalOpen">
      <template #content>
        <UCard>
          <template #header>
            <h3
              class="text-base font-semibold leading-6 text-gray-900 dark:text-white"
            >
              Confirm Department Change
            </h3>
          </template>
          <p class="text-sm text-gray-500">
            Changing the department will
            <strong>reset all onboarding progress</strong> for this user. New tasks
            will be assigned based on the new department. Are you sure?
          </p>
          <template #footer>
            <div class="flex justify-end gap-2">
              <UButton
                label="Cancel"
                color="neutral"
                variant="ghost"
                @click="isConfirmModalOpen = false"
              />
              <UButton label="Confirm" color="error" @click="performUpdate" />
            </div>
          </template>
        </UCard>
      </template>
    </UModal>
    <!-- Delete Modal -->
    <DeleteModal
      v-model="isDeleteModalOpen"
      title="Delete User"
      :description="`Are you sure you want to delete ${userToDelete?.name}? This action cannot be undone.`"
      :on-confirm="handleDelete"
    />
  </div>
</template>
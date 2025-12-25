<script setup lang="ts">
  import type { TableColumn, ContextMenuItem } from '@nuxt/ui'
  import { refDebounced } from '@vueuse/core'
  import { z } from 'zod'
  import type { Field } from '~/components/FormModal.vue'

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

  // Reset page when tab or search changes
  watch([activeTab, debouncedSearch], () => {
    page.value = 1
  })

  // Edit Modal State
  const isEditModalOpen = ref(false)
  const selectedUserId = ref<string | null>(null)
  const userFormState = reactive({
    name: '',
    email: '',
    phone: '',
  })

  const userSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email address'),
    phone: z.string().nullable().optional(),
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

  async function handleUpdateUser(data: typeof userFormState) {
    try {
      await $fetch(`/api/put/users/${selectedUserId.value}`, {
        method: 'PUT',
        body: {
          ...data,
          phone: parsePhoneNumber(data.phone),
        },
      })
      toast.add({
        title: 'User updated successfully',
        color: 'success',
      })
      await refresh()
    } catch (error: any) {
      toast.add({
        title: error.data?.statusMessage || 'Failed to update user',
        color: 'error',
      })
      throw error
    }
  }

  function getUserActions(row: any): ContextMenuItem[][] {
    return [
      [
        {
          label: 'Edit',
          icon: 'i-heroicons-pencil',
          onSelect: () => {
            selectedUserId.value = row.id
            userFormState.name = row.name
            userFormState.email = row.email
            userFormState.phone = row.phone || ''
            isEditModalOpen.value = true
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
      accessorKey: 'email',
      header: 'Email',
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
      cell: ({ row }) => formatPhoneNumber(row.original.phone) || 'N/A',
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
      :row-menu-items="getUserActions"
    />

    <FormModal
      v-model="isEditModalOpen"
      title="Edit User"
      :schema="userSchema"
      :state="userFormState"
      :fields="userFields"
      :on-submit="handleUpdateUser"
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
    </FormModal>
  </div>
</template>
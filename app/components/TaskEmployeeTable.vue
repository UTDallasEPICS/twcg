<script setup lang="ts">
import { refDebounced } from '@vueuse/core'
import type { TableColumn } from '@nuxt/ui'

const props = defineProps<{
  onboardingTasks: any[]
}>()

const emit = defineEmits<{
  (e: 'toggle', row: any, checked: boolean): void
}>()

const page = ref(1)
const limit = ref(5)
const search = ref('')
const debouncedSearch = refDebounced(search, 300)

// Reset page on search
watch(debouncedSearch, () => {
  page.value = 1
})

const filteredData = computed(() => {
  let data = props.onboardingTasks
  if (debouncedSearch.value) {
    const s = debouncedSearch.value.toLowerCase()
    data = data.filter((ot: any) => 
      ot.user.name.toLowerCase().includes(s) || 
      ot.user.email.toLowerCase().includes(s)
    )
  }
  return data
})

const paginatedData = computed(() => {
  const start = (page.value - 1) * limit.value
  return filteredData.value.slice(start, start + limit.value)
})

const columns: TableColumn<any>[] = [
  {
    accessorKey: 'completed',
    header: 'Status',
  },
  {
    accessorKey: 'user.name',
    header: 'Employee',
  },
  {
    accessorKey: 'user.email',
    header: 'Email',
  }
]
</script>

<template>
  <Table
    v-model:page="page"
    v-model:items-per-page="limit"
    v-model:search="search"
    :columns="columns"
    :data="paginatedData"
    :total="filteredData.length"
  >
    <template #completed-cell="{ row }">
      <div class="flex items-center gap-2">
        <UCheckbox
          :model-value="row.original.completed"
          @update:model-value="(val) => emit('toggle', row.original, val)"
        />
        <span :class="['text-xs', row.original.completed ? 'text-green-600' : 'text-gray-500']">
          {{ row.original.completed ? 'Done' : 'Pending' }}
        </span>
      </div>
    </template>
  </Table>
</template>

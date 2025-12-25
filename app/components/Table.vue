<script setup lang="ts">
  import type { TableColumn, ContextMenuItem, TableRow } from '@nuxt/ui'
  import { h, resolveComponent } from 'vue'

  const props = defineProps<{
    columns: TableColumn<any>[]
    data: any[]
    loading?: boolean
    sticky?: boolean | 'header' | 'footer'
    class?: any
    ui?: any
    page?: number
    total?: number
    itemsPerPage?: number
    itemsPerPageOptions?: number[]
    rowMenuItems?: (row: any) => ContextMenuItem[] | ContextMenuItem[][]
    search?: string
  }>()

  const emit = defineEmits<{
    (e: 'update:page', value: number): void
    (e: 'update:itemsPerPage', value: number): void
    (e: 'update:search', value: string): void
    (e: 'row-contextmenu', event: MouseEvent, row: TableRow<any>): void
    (e: 'select', event: any, row: TableRow<any>): void
  }>()

  const UButton = resolveComponent('UButton')
  const UDropdownMenu = resolveComponent('UDropdownMenu')

  const currentPage = computed({
    get: () => props.page || 1,
    set: (value) => emit('update:page', value),
  })

  const currentLimit = computed({
    get: () => props.itemsPerPage || 10,
    set: (value) => {
      emit('update:itemsPerPage', Number(value))
      currentPage.value = 1
    },
  })

  const searchQuery = computed({
    get: () => props.search || '',
    set: (value) => emit('update:search', value),
  })

  const tableColumns = computed(() => {
    const cols = [...props.columns]
    if (props.rowMenuItems) {
      cols.push({
        id: 'actions',
        header: '',
        size: 40,
        meta: {
          class: {
            th: 'sticky right-0 z-10 bg-gray-50 dark:bg-gray-900 !p-2 w-1',
            td: 'sticky right-0 z-10 bg-white dark:bg-gray-900 !p-2 w-1',
          },
        },
        cell: ({ row }) => {
          const items = props.rowMenuItems!(row.original)
          // Ensure items is an array of arrays for UDropdownMenu
          const dropdownItems = items.length > 0 && Array.isArray(items[0]) ? items : [items]

          return h(UDropdownMenu, { items: dropdownItems, content: { align: 'end' } }, () =>
            h(UButton, {
              icon: 'i-heroicons-ellipsis-horizontal',
              color: 'neutral',
              variant: 'soft',
              size: 'sm',
            })
          )
        },
      })
    }
    return cols
  })

  const menuItems = ref<ContextMenuItem[] | ContextMenuItem[][]>([])

  function onContextmenu(event: MouseEvent, row: TableRow<any>) {
    if (props.rowMenuItems) {
      menuItems.value = props.rowMenuItems(row.original)
    }
    emit('row-contextmenu', event, row)
  }
</script>

<template>
  <div
    class="flex w-full flex-col overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800"
  >
    <div v-if="search !== undefined" class="border-b border-gray-200 p-4 dark:border-gray-800">
      <UInput
        v-model="searchQuery"
        icon="i-heroicons-magnifying-glass"
        placeholder="Search..."
        class="w-full"
      />
    </div>
    <UContextMenu :items="menuItems" :disabled="!rowMenuItems">
      <UTable
        :data="data"
        :columns="tableColumns"
        :loading="loading"
        :sticky="sticky"
        :class="['flex-1', $props.class]"
        :ui="{
          wrapper: 'relative w-full overflow-x-auto',
          base: 'min-w-full table-fixed',
          divide: 'divide-y divide-gray-200 dark:divide-gray-800',
          thead: 'bg-gray-50 dark:bg-gray-900',
          tbody: 'divide-y divide-gray-200 dark:divide-gray-800',
          tr: {
            base: 'transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-800/50 cursor-pointer',
          },
          th: {
            base: 'text-left rtl:text-right',
            padding: 'px-4 py-3.5',
            color: 'text-gray-900 dark:text-white',
            font: 'font-semibold text-sm',
          },
          td: {
            base: 'whitespace-nowrap',
            padding: 'px-4 py-4',
            color: 'text-gray-500 dark:text-gray-400',
            font: 'text-sm',
          },
          loadingState: {
            wrapper: 'flex flex-col items-center justify-center flex-1 px-6 py-14 sm:px-14',
            label: 'text-sm text-center text-gray-900 dark:text-white',
            icon: 'w-6 h-6 mx-auto text-gray-400 dark:text-gray-500 mb-4 animate-spin',
          },
          ...ui,
        }"
        @contextmenu="onContextmenu"
        @select="(event, row) => $emit('select', event, row)"
      />
    </UContextMenu>
    <div
      v-if="(total || 0) > 0"
      class="flex flex-wrap items-center justify-between gap-4 border-t border-gray-200 p-4 dark:border-gray-800"
    >
      <div class="flex items-center gap-2">
        <span class="text-sm text-gray-500 dark:text-gray-400">Rows</span>
        <USelect v-model="currentLimit" :items="itemsPerPageOptions || [1, 3, 5]" class="w-20" />
      </div>
      <UPagination v-model:page="currentPage" :total="total" :items-per-page="itemsPerPage" />
    </div>
  </div>
</template>

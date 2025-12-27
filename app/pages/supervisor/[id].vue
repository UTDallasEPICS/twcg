<script setup lang="ts">
  import type { TableColumn } from '@nuxt/ui'
  import { authClient } from '~/utils/auth-client'

  const route = useRoute()
  const userId = route.params.id as string

  // Fetch Current Session
  const { data: session } = await authClient.useSession(useFetch)
  const isSupervisor = computed(() => session.value?.user?.role === 'SUPERVISOR')

  // Fetch User Info
  const { data: user } = await useFetch(`/api/get/users/byId/${userId}`)

  // Fetch Supervising Tasks with deep nested Onboarding Tasks
  const { data: supervisingTasks, status, refresh } = await useFetch(
    `/api/get/users/${userId}/supervising-tasks`
  )

  const search = ref('')
  const activeTab = ref('')
  const nestedOpenTasks = ref<string[]>([])

  // Computed: Group Tasks by Department
  const groupedTasks = computed(() => {
    if (!supervisingTasks.value) return []

    const groups: Record<string, any[]> = {}
    
    supervisingTasks.value.forEach((task: any) => {
      const deptName = task.department?.name || 'Unassigned'
      if (!groups[deptName]) {
        groups[deptName] = []
      }
      groups[deptName].push(task)
    })

    // Sort departments
    return Object.keys(groups).sort().map(dept => ({
      label: dept,
      value: dept, // stable value for v-model
      tasks: groups[dept]
    }))
  })

  // Watch for groupedTasks to set initial activeTab
  watch(groupedTasks, (newVal) => {
    if (newVal.length > 0 && !activeTab.value) {
      activeTab.value = newVal[0].value
    }
  }, { immediate: true })

  // Watch for supervisingTasks change to initialize nestedOpenTasks
  watch(supervisingTasks, (newTasks) => {
    if (newTasks && nestedOpenTasks.value.length === 0) {
      nestedOpenTasks.value = newTasks.map((t: any) => String(t.id))
    }
  }, { immediate: true })

  function getFilteredTasks(tasks: any[], query: string) {
    if (!query) return tasks
    const lowerQuery = query.toLowerCase()
    return tasks.filter((t: any) => 
      t.desc.toLowerCase().includes(lowerQuery) || 
      t.category.toLowerCase().includes(lowerQuery)
    )
  }

  function toggleAll(deptTasks: any[]) {
    const visibleTaskIds = getFilteredTasks(deptTasks, search.value).map(t => String(t.id))
    const allOpen = visibleTaskIds.every(id => nestedOpenTasks.value.includes(id))
    
    if (allOpen) {
      // Close all visible
      nestedOpenTasks.value = nestedOpenTasks.value.filter(id => !visibleTaskIds.includes(id))
    } else {
      // Open all visible
      const newIds = new Set([...nestedOpenTasks.value, ...visibleTaskIds])
      nestedOpenTasks.value = Array.from(newIds)
    }
  }

  async function toggleStatus(row: any, checked: boolean) {
    // Optimistic update
    const task = supervisingTasks.value?.find((t: any) => 
      t.onboardingTasks?.some((ot: any) => ot.id === row.id)
    )
    const onboardingTask = task?.onboardingTasks?.find((ot: any) => ot.id === row.id)
    
    if (onboardingTask) {
      onboardingTask.completed = checked
    }

    try {
      await $fetch(`/api/put/onboarding-tasks/${row.id}`, {
        method: 'PUT',
        body: { completed: checked }
      })
      // Refresh in background to ensure consistency
      refresh()
    } catch (e) {
      console.error(e)
      // Revert on error
      if (onboardingTask) {
        onboardingTask.completed = !checked
      }
      alert('Failed to update status')
    }
  }
</script>

<template>
  <div class="flex flex-col gap-6 p-6">
    <!-- Header -->
    <div class="flex items-center gap-4">
      <UButton
        v-if="!isSupervisor"
        icon="i-heroicons-arrow-left"
        color="neutral"
        variant="ghost"
        to="/"
      />
      <div>
        <h1 v-if="!isSupervisor" class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ user?.name }}
        </h1>
      </div>
    </div>

    <!-- Content -->
    <div v-if="status === 'pending' && !supervisingTasks" class="py-10 text-center">
       <UIcon name="i-heroicons-arrow-path" class="animate-spin h-8 w-8 text-gray-400" />
    </div>
    
    <div v-else-if="groupedTasks.length" class="flex flex-col gap-4">
      <!-- Departments Tabs -->
      <UTabs v-model="activeTab" :items="groupedTasks" class="w-full">
        <template #content="{ item: dept }">
          <div class="flex flex-col gap-4 pt-4">
            <!-- Search Bar & Toggle All -->
            <div class="flex gap-2">
              <UInput
                v-model="search"
                icon="i-heroicons-magnifying-glass"
                placeholder="Search tasks..."
                class="flex-1"
              />
              <UButton
                color="neutral"
                variant="outline"
                :icon="getFilteredTasks(dept.tasks, search).every(t => nestedOpenTasks.includes(String(t.id))) ? 'i-heroicons-chevron-double-up' : 'i-heroicons-chevron-double-down'"
                @click="toggleAll(dept.tasks)"
              >
                <span class="hidden sm:inline">
                  {{ getFilteredTasks(dept.tasks, search).every(t => nestedOpenTasks.includes(String(t.id))) ? 'Collapse All' : 'Expand All' }}
                </span>
              </UButton>
            </div>

            <!-- Filtered Tasks List -->
            <UAccordion
              v-model="nestedOpenTasks"
              type="multiple"
              :items="getFilteredTasks(dept.tasks, search).map((task: any) => ({
                label: `${task.desc} (${task.category})`,
                value: String(task.id),
                onboardingTasks: task.onboardingTasks
              }))"
              :ui="{
                root: 'flex flex-col gap-2',
                item: 'border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden bg-white dark:bg-gray-900',
                trigger: 'p-3 hover:bg-gray-50 dark:hover:bg-gray-800',
                content: 'border-t border-gray-200 dark:border-gray-700 p-4'
              }"
            >
              <template #body="{ item: task }">
                <div v-if="task.onboardingTasks.length === 0" class="text-sm text-gray-500 italic">
                  No employees currently assigned.
                </div>
                
                <TaskEmployeeTable 
                  v-else
                  :onboarding-tasks="task.onboardingTasks"
                  @toggle="toggleStatus"
                />
              </template>
            </UAccordion>
            
            <div v-if="getFilteredTasks(dept.tasks, search).length === 0" class="text-center text-gray-500 py-4">
              No tasks match your search.
            </div>
          </div>
        </template>
      </UTabs>
    </div>
    
    <div v-else class="py-10 text-center text-gray-500">
      No tasks assigned to this supervisor.
    </div>
  </div>
</template>
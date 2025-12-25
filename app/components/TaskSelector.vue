<script setup lang="ts">
  import { computed, ref } from 'vue'

  interface Task {
    id: string
    desc: string
    department: {
      id: string
      name: string
    }
  }

  const props = defineProps<{
    modelValue: string[]
    tasks: any[]
  }>()

  const emit = defineEmits<{
    (e: 'update:modelValue', value: string[]): void
  }>()

  const search = ref('')
  const selectedDept = ref('All Departments')

  // Parse tasks once
  const parsedTasks = computed(() => {
    return props.tasks.map((task) => {
      const match = task.label.match(/^\[(.*?)\] (.*)$/)
      const deptName = match ? match[1] : 'Other'
      const desc = match ? match[2] : task.label
      return { ...task, deptName, desc }
    })
  })

  const uniqueDepartments = computed(() => {
    const depts = new Set(parsedTasks.value.map((t) => t.deptName))
    return ['All Departments', ...Array.from(depts).sort()]
  })

  const filteredGroups = computed(() => {
    const groups: Record<string, any[]> = {}
    
    parsedTasks.value.forEach((task) => {
      // Filter by Department
      if (selectedDept.value !== 'All Departments' && task.deptName !== selectedDept.value) {
        return
      }
      
      // Filter by Search
      if (search.value && !task.desc.toLowerCase().includes(search.value.toLowerCase())) {
        return
      }

      if (!groups[task.deptName]) {
        groups[task.deptName] = []
      }
      groups[task.deptName].push(task)
    })
    return groups
  })

  function toggleTask(taskId: string, checked: boolean) {
    const newValue = [...props.modelValue]
    if (checked) {
      newValue.push(taskId)
    } else {
      const index = newValue.indexOf(taskId)
      if (index > -1) {
        newValue.splice(index, 1)
      }
    }
    emit('update:modelValue', newValue)
  }
</script>

<template>
  <div class="flex flex-col gap-3 border rounded-md p-3 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
    <!-- Filters -->
    <div class="flex gap-2">
      <USelectMenu
        v-model="selectedDept"
        :items="uniqueDepartments"
        class="w-1/3"
        :ui="{ icon: { leading: { pointer: '' } } }"
      />
      <UInput
        v-model="search"
        icon="i-heroicons-magnifying-glass"
        placeholder="Search tasks..."
        class="flex-1"
      />
    </div>

    <!-- Task List -->
    <div class="flex flex-col gap-4 max-h-72 overflow-y-auto pr-1">
      <div v-if="Object.keys(filteredGroups).length === 0" class="text-sm text-gray-500 text-center py-4">
        No tasks found.
      </div>
      
      <div v-for="(tasks, deptName) in filteredGroups" :key="deptName" class="flex flex-col gap-2">
        <h4 class="font-bold text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 sticky top-0 bg-white dark:bg-gray-800 py-1 z-10 border-b border-gray-100 dark:border-gray-700">
          {{ deptName }}
        </h4>
        <div class="pl-2 flex flex-col gap-1.5">
          <UCheckbox
            v-for="task in tasks"
            :key="task.id"
            :model-value="modelValue.includes(task.id)"
            :label="task.desc"
            @update:model-value="(checked) => toggleTask(task.id, checked)"
          />
        </div>
      </div>
    </div>
    
    <!-- Summary -->
    <div class="text-xs text-right text-gray-500 pt-2 border-t border-gray-100 dark:border-gray-700">
      {{ modelValue.length }} tasks selected
    </div>
  </div>
</template>


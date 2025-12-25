<script setup lang="ts">
  const props = defineProps<{
    modelValue: boolean
    title: string
    description?: string
    onConfirm: () => Promise<void>
  }>()

  const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
  }>()

  const isOpen = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value),
  })

  const loading = ref(false)

  async function handleConfirm() {
    loading.value = true
    try {
      await props.onConfirm()
      isOpen.value = false
    } finally {
      loading.value = false
    }
  }
</script>

<template>
  <UModal v-model:open="isOpen">
    <template #content>
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
              {{ title }}
            </h3>
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-heroicons-x-mark-20-solid"
              class="-my-1"
              @click="isOpen = false"
            />
          </div>
        </template>
        
        <p class="text-sm text-gray-500">
          {{ description || 'Are you sure you want to delete this item? This action cannot be undone.' }}
        </p>

        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton
              label="Cancel"
              color="neutral"
              variant="ghost"
              @click="isOpen = false"
            />
            <UButton
              label="Delete"
              color="error"
              :loading="loading"
              @click="handleConfirm"
            />
          </div>
        </template>
      </UCard>
    </template>
  </UModal>
</template>

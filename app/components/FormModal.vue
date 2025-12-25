<script setup lang="ts" generic="T extends Record<string, any>">
  import type { ZodType } from 'zod'
  import type { FormSubmitEvent } from '#ui/types'

  export interface Field {
    name: keyof T
    label: string
    type?: string
    placeholder?: string
    required?: boolean
  }

  const props = defineProps<{
    modelValue: boolean
    title: string
    schema?: ZodType<any>
    state: T
    fields?: Field[]
    onSubmit: (data: T) => Promise<void>
  }>()

  const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
  }>()

  const isOpen = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value),
  })

  const loading = ref(false)

  async function handleSubmit(event: FormSubmitEvent<T>) {
    loading.value = true
    try {
      await props.onSubmit(event.data)
      isOpen.value = false
    } catch (error) {
      console.error('Form submission failed:', error)
    } finally {
      loading.value = false
    }
  }
</script>

<template>
  <UModal v-model:open="isOpen">
    <template #content>
      <UCard
        :ui="{
          ring: '',
          divide: 'divide-y divide-gray-100 dark:divide-gray-800',
        }"
      >
        <template #header>
          <div class="flex items-center justify-between">
            <h3
              class="text-base font-semibold leading-6 text-gray-900 dark:text-white"
            >
              {{ title }}
            </h3>
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-x-mark-20-solid"
              class="-my-1"
              @click="isOpen = false"
            />
          </div>
        </template>

        <UForm
          :schema="schema"
          :state="state"
          class="space-y-4"
          @submit="handleSubmit"
        >
          <slot>
            <template v-if="fields">
              <UFormGroup
                v-for="field in fields"
                :key="field.name as string"
                :label="field.label"
                :name="field.name as string"
                :required="field.required"
              >
                <UInput
                  v-model="state[field.name]"
                  :type="field.type || 'text'"
                  :placeholder="field.placeholder"
                />
              </UFormGroup>
            </template>
          </slot>

          <div class="flex justify-end gap-2 pt-4">
            <UButton
              label="Cancel"
              color="gray"
              variant="ghost"
              @click="isOpen = false"
            />
            <UButton
              type="submit"
              label="Save"
              color="primary"
              :loading="loading"
            />
          </div>
        </UForm>
      </UCard>
    </template>
  </UModal>
</template>

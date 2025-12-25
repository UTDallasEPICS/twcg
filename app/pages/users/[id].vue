<script setup lang="ts">
  import type { TableColumn } from '@nuxt/ui'

  const route = useRoute()
  const userId = route.params.id as string

    // Fetch User Info

    const { data: user } = await useFetch(`/api/get/users/byId/${userId}`)

  

      // --- ONBOARDING LOGIC ---

  

      const { data: categories, execute: fetchCategories } = await useFetch(

  

        `/api/get/users/${userId}/task-categories`,

  

        { immediate: false }

  

      )

  

      const {

  

        data: onboardingTasks,

  

        status: onboardingStatus,

  

        execute: fetchOnboarding,

  

      } = await useFetch(`/api/get/users/${userId}/onboarding-tasks`, {

  

        immediate: false,

  

      })

  

    

  

      // --- SUPERVISOR LOGIC ---

  

      const {

  

        data: supervisingTasks,

  

        status: supervisorStatus,

  

        execute: fetchSupervising,

  

      } = await useFetch(`/api/get/users/${userId}/supervising-tasks`, {

  

        immediate: false,

  

      })

  

    

  

      // Initialize Data based on Role

  

      watch(

  

        () => user.value?.role,

  

        async (role) => {

  

          if (role === 'ONBOARDING') {

  

            await Promise.all([fetchCategories(), fetchOnboarding()])

  

          } else if (role === 'SUPERVISOR') {

  

            await fetchSupervising()

  

          }

  

        },

  

        { immediate: true }

  

      )

  

    

  

      // Tabs State

  

      const activeTab = ref('')

  

    

  

      // 1. Onboarding Tabs (Categories)

  

      const onboardingTabs = computed(() => {

  

        return (categories.value || []).map((cat: string) => ({

  

          label: cat,

  

          value: cat,

  

        }))

  

      })

  

    

  

      // 2. Supervisor Tabs (Departments)

  

      const supervisorTabs = computed(() => {

  

        if (!supervisingTasks.value) return []

  

        const depts = new Set(

  

          supervisingTasks.value.map((t) => t.department?.name).filter(Boolean)

  

        )

  

        console.log('Supervisor Depts:', depts)

  

        return Array.from(depts).map((d) => ({ label: d, value: d }))

  

      })

  

    // Combined Tabs

    const currentTabs = computed(() => {

      return user.value?.role === 'SUPERVISOR'

        ? supervisorTabs.value

        : onboardingTabs.value

    })

  

    // Set initial tab

    watch(

      currentTabs,

      (tabs) => {

        if (tabs.length && !activeTab.value) {

          activeTab.value = tabs[0].value

        }

      },

      { immediate: true }

    )

  

    // Filtered Data

    const filteredData = computed(() => {

      if (user.value?.role === 'SUPERVISOR') {

        return (supervisingTasks.value || []).filter(

          (t) => t.department?.name === activeTab.value

        )

      } else {

        return (onboardingTasks.value || []).filter(

          (ot) => ot.task.category === activeTab.value

        )

      }

    })

  

    const supervisorColumns: TableColumn<any>[] = [

      { accessorKey: 'desc', header: 'Task Description' },

      { accessorKey: 'category', header: 'Category' },

    ]

    

    const onboardingColumns: TableColumn<any>[] = [

      {

        accessorKey: 'task.desc',

        header: 'Task',

      },

      {

        accessorKey: 'completed',

        header: 'Status',

        cell: ({ row }) => {

          const completed = row.original.completed

          return h(

            'div',

            { class: 'flex items-center' },

            h(

              'span',

              {

                class: [

                  'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',

                  completed

                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'

                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',

                ],

              },

              completed ? 'Completed' : 'Pending'

            )

          )

        },

      },

    ]

  </script>

  

  <template>

    <div class="flex flex-col gap-6 p-6">

      <div class="flex items-center gap-4">

        <UButton

          icon="i-heroicons-arrow-left"

          color="neutral"

          variant="ghost"

          to="/"

        />

        <div>

          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">

            {{ user?.name }}

          </h1>

          <p class="text-sm text-gray-500 dark:text-gray-400">

            {{ user?.role }} • {{ user?.department?.name || 'No Department' }}

          </p>

        </div>

      </div>

  

      <div v-if="currentTabs.length" class="flex flex-col gap-4">

        <UTabs v-model="activeTab" :items="currentTabs" class="w-full" />

  

        <Table

          :columns="user?.role === 'SUPERVISOR' ? supervisorColumns : onboardingColumns"

          :data="filteredData"

          :loading="onboardingStatus === 'pending' || supervisorStatus === 'pending'"

        />

      </div>

      <div v-else class="py-10 text-center">

        <p class="text-gray-500 dark:text-gray-400">

          No tasks found for this user.

        </p>

      </div>

    </div>

  </template>

  
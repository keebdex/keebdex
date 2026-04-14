<template>
  <SharedRedirectPage v-if="!isAdmin" to="/account/settings" />

  <UDashboardPanel v-else id="account-users">
    <template #header>
      <UDashboardNavbar title="User Management" />
    </template>

    <template #body>
      <UPageCard variant="subtle" class="space-y-4 mx-auto w-full lg:max-w-5xl">
        <div
          class="flex items-center gap-2 px-4 py-3.5 border-b border-accented"
        >
          <UInput
            v-model="term"
            icon="hugeicons:search-01"
            placeholder="Search by email"
            class="flex-1"
          />

          <USelect v-model="role" :items="filterOptions" class="w-44" />
        </div>

        <template #header>
          Manage role and assignment access for platform users.
        </template>

        <UTable
          sticky
          :loading="status === 'pending'"
          :data="data.users"
          :columns="columns"
        >
          <template #email-cell="{ row }">
            <div class="font-medium truncate max-w-64">
              {{ row.original.email }}
            </div>
          </template>

          <template #role-cell="{ row }">
            <UBadge
              v-if="row.original.role"
              :label="getRoleLabel(row.original.role)"
              variant="subtle"
              :color="roleMap[row.original.role]?.color"
              :icon="roleMap[row.original.role]?.icon"
            />
          </template>

          <template #assignments-cell="{ row }">
            <div class="flex flex-wrap items-center gap-1 max-w-72">
              <UBadge
                v-for="assignment in getVisibleAssignments(
                  row.original.assignments,
                )"
                :key="assignment"
                :label="assignment"
                :avatar="{
                  src: `/logo/${assignment}.png`,
                  ui: {
                    root: 'rounded-none bg-transparent',
                    image: $colorMode.value === 'dark' && 'invert',
                  },
                }"
                variant="subtle"
                color="neutral"
              />

              <UBadge
                v-if="getOverflowCount(row.original.assignments) > 0"
                :label="`+${getOverflowCount(row.original.assignments)}`"
                variant="soft"
                color="neutral"
              />
            </div>
          </template>

          <template #action-cell="{ row }">
            <UButton
              label="Edit"
              size="sm"
              icon="hugeicons:dashboard-circle-edit"
              @click="openEditor(row.original)"
            />
          </template>
        </UTable>

        <UPagination
          v-if="data.count > size"
          :page="page"
          :items-per-page="size"
          :total="data.count"
          class="border-t border-default pt-4 mt-auto"
          :ui="{
            list: 'justify-center',
          }"
          @update:page="setPage"
        />
      </UPageCard>

      <UModal v-model:open="editVisible" title="Edit User Access">
        <template #body>
          <UForm :state="form" class="space-y-4" @submit="onSubmit">
            <UFormField label="Email">
              <UInput
                :model-value="selectedUser?.email"
                disabled
                class="w-full"
              />
            </UFormField>

            <UFormField label="Role" name="role">
              <USelect
                v-model="form.role"
                :items="roleOptions"
                class="w-full"
              />
            </UFormField>

            <UFormField
              label="Assignments"
              name="assignments"
              help="Press Enter to add multiple assignments."
            >
              <UInputTags
                v-model="form.assignments"
                placeholder="Type assignment and press Enter"
                class="w-full"
              />
            </UFormField>

            <UButton type="submit" block color="primary" :loading="saving">
              Save
            </UButton>
          </UForm>
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>

<script setup>
const userStore = useUserStore()
const { isAdmin } = storeToRefs(userStore)
const toast = useToast()

const roleOptions = Object.entries(roleMap).map(([value, { label, icon }]) => ({
  label,
  value,
  icon,
}))

const columns = [
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'role',
    header: 'Role',
  },
  {
    accessorKey: 'assignments',
    header: 'Assignments',
  },
  {
    id: 'action',
  },
]

const { page, size, setPage, resetPage } = usePagination(20)
const term = ref('')
const role = ref('all')

const filterOptions = [
  {
    label: 'All Users',
    value: 'all',
    icon: 'hugeicons:user-group',
  },
  ...roleOptions,
]

const query = computed(() => {
  return {
    page: page.value,
    size: size.value,
    term: term.value,
    role: role.value,
  }
})

const { data, status, refresh } = await useAsyncData(
  'admin-users',
  () => {
    if (!isAdmin.value) {
      return { users: [], count: 0, page: 1, size }
    }

    return $fetch('/api/admin/users', {
      query: query.value,
    })
  },
  {
    watch: [isAdmin, page, term, role],
    default: () => ({ users: [], count: 0, page: 1, size }),
  },
)

watch([term, role], resetPage)

const getVisibleAssignments = (assignments) => {
  if (!Array.isArray(assignments) || assignments.length === 0) {
    return []
  }

  return assignments.length > 3 ? assignments.slice(0, 2) : assignments
}

const getOverflowCount = (assignments) => {
  if (!Array.isArray(assignments) || assignments.length <= 3) {
    return 0
  }

  return assignments.length - 2
}

const normalizeAssignments = (values) => {
  if (!Array.isArray(values)) {
    return null
  }

  const parsed = values.map((item) => item.trim()).filter(Boolean)

  return parsed.length ? [...new Set(parsed)] : null
}

const editVisible = ref(false)
const saving = ref(false)
const selectedUser = ref(null)

const form = ref({
  role: null,
  assignments: [],
})

const openEditor = (user) => {
  selectedUser.value = user
  form.value.role = user.role || null
  form.value.assignments = Array.isArray(user.assignments)
    ? [...user.assignments]
    : []
  editVisible.value = true
}

const onSubmit = async () => {
  if (!selectedUser.value) {
    return
  }

  saving.value = true

  try {
    await $fetch(`/api/admin/users/${selectedUser.value.id}`, {
      method: 'post',
      body: {
        role: form.value.role || null,
        assignments: normalizeAssignments(form.value.assignments),
      },
    })

    toast.add(handleSuccess('save', 'User access'))
    editVisible.value = false
    await refresh()
  } catch (error) {
    toast.add(handleError(error))
  } finally {
    saving.value = false
  }
}

useSeoMeta({
  title: 'User Management',
})

definePageMeta({
  middleware: 'auth',
})
</script>

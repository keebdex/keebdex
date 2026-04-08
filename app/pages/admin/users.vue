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

          <UButton
            icon="hugeicons:refresh"
            color="neutral"
            variant="soft"
            :loading="status === 'pending'"
            @click="refresh"
          >
            Refresh
          </UButton>
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
            <div class="font-medium truncate max-w-48">
              {{ row.original.email }}
            </div>
          </template>

          <template #role-cell="{ row }">
            <UBadge
              v-if="row.original.role"
              :label="getRoleLabel(row.original.role)"
              variant="subtle"
              :color="roleMap[row.original.role]?.color"
            />
          </template>

          <template #assignments-cell="{ row }">
            <span class="text-sm text-muted truncate max-w-72 block">
              {{ formatAssignments(row.original.assignments) }}
            </span>
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
          v-model:page="page"
          :items-per-page="size"
          :total="data.count"
          class="border-t border-default pt-4 mt-auto"
          :ui="{
            list: 'justify-center',
          }"
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
              help="Separate values by comma or line break."
            >
              <UTextarea
                v-model="form.assignments"
                :rows="4"
                placeholder="maker-a, maker-b"
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
import { Constants } from '~/types/database.types'

const userStore = useUserStore()
const { isAdmin } = storeToRefs(userStore)
const toast = useToast()

const roleOptions = Constants.public.Enums.user_role.map((role) => ({
  label: getRoleLabel(role),
  value: role,
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

const page = ref(1)
const size = ref(20)
const term = ref('')

const query = computed(() => {
  return {
    page: page.value,
    size: size.value,
    term: term.value,
  }
})

const { data, status, refresh } = await useAsyncData(
  'admin-users',
  () => {
    if (!isAdmin.value) {
      return { users: [], count: 0, page: 1, size: 20 }
    }

    return $fetch('/api/admin/users', {
      query: query.value,
    })
  },
  {
    watch: [isAdmin, page, size, term],
    default: () => ({ users: [], count: 0, page: 1, size: 20 }),
  },
)

watch(term, () => {
  page.value = 1
})

const formatAssignments = (assignments) => {
  if (!Array.isArray(assignments) || assignments.length === 0) {
    return '-'
  }

  return assignments.join(', ')
}

const parseAssignments = (value) => {
  const parsed = String(value || '')
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean)

  return parsed.length ? [...new Set(parsed)] : null
}

const editVisible = ref(false)
const saving = ref(false)
const selectedUser = ref(null)

const form = ref({
  role: null,
  assignments: '',
})

const openEditor = (user) => {
  selectedUser.value = user
  form.value.role = user.role || null
  form.value.assignments = Array.isArray(user.assignments)
    ? user.assignments.join(', ')
    : ''
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
        assignments: parseAssignments(form.value.assignments),
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

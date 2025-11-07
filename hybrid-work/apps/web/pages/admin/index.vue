<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { definePageMeta } from '#imports';
import { useApi } from '~/utils/api';
import { useSession } from '~/stores/session';

definePageMeta({ middleware: ['admin'] });

interface ManagedUser {
  id: string;
  name: string;
  email: string;
  username: string;
  role: 'ADMIN' | 'MEMBER';
  createdAt: string;
}

const api = useApi();
const session = useSession();

const users = ref<ManagedUser[]>([]);
const loadingUsers = ref(false);
const userForm = reactive({
  name: '',
  email: '',
  username: '',
  password: '',
});
const formError = ref('');
const editingUserId = ref<string | null>(null);
const adminPasswordForm = reactive({
  currentPassword: '',
  newPassword: '',
});
const adminPasswordMessage = ref('');
const adminPasswordError = ref('');

const sortedUsers = computed(() =>
  [...users.value].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
);

function resetForm() {
  userForm.name = '';
  userForm.email = '';
  userForm.username = '';
  userForm.password = '';
  editingUserId.value = null;
  formError.value = '';
}

function startEdit(user: ManagedUser) {
  editingUserId.value = user.id;
  userForm.name = user.name;
  userForm.email = user.email;
  userForm.username = user.username;
  userForm.password = '';
  formError.value = '';
}

async function fetchUsers() {
  loadingUsers.value = true;
  try {
    const { data } = await api.get<ManagedUser[]>('/admin/users');
    users.value = data;
  } finally {
    loadingUsers.value = false;
  }
}

async function submitUserForm() {
  formError.value = '';
  const payload = {
    name: userForm.name.trim(),
    email: userForm.email.trim(),
    username: userForm.username.trim(),
  };
  try {
    if (editingUserId.value) {
      const updateBody: Record<string, string> = { ...payload };
      if (userForm.password.trim()) {
        updateBody.password = userForm.password.trim();
      }
      await api.patch(`/admin/users/${editingUserId.value}`, updateBody);
    } else {
      if (!userForm.password.trim()) {
    formError.value = 'Password is required when creating a user';
        return;
      }
      await api.post('/admin/users', { ...payload, password: userForm.password.trim() });
    }
    await fetchUsers();
    resetForm();
  } catch (error: any) {
    formError.value = error?.response?.data?.message ?? 'Operation failed. Please try again later';
  }
}

async function deleteUser(userId: string) {
  if (!confirm('Delete this user? This action cannot be undone.')) return;
  try {
    await api.delete(`/admin/users/${userId}`);
    await fetchUsers();
  } catch (error: any) {
    formError.value = error?.response?.data?.message ?? 'Failed to delete user';
  }
}

async function updateAdminPassword() {
  adminPasswordMessage.value = '';
  adminPasswordError.value = '';
  try {
    await api.patch('/admin/account/password', {
      currentPassword: adminPasswordForm.currentPassword,
      newPassword: adminPasswordForm.newPassword,
    });
    adminPasswordMessage.value = 'Password updated';
    adminPasswordForm.currentPassword = '';
    adminPasswordForm.newPassword = '';
  } catch (error: any) {
    adminPasswordError.value = error?.response?.data?.message ?? 'Failed to update password';
  }
}

onMounted(fetchUsers);
</script>

<template>
  <div class="flex flex-1 min-h-0 h-full overflow-hidden bg-gray-50">
    <div class="mx-auto flex w-full max-w-6xl flex-col gap-8 overflow-y-auto px-6 py-8">
      <section class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-lg font-semibold text-gray-900">Users</h2>
            <p class="text-sm text-gray-500">Manage member accounts. Admin accounts are hidden from this list.</p>
          </div>
          <button
            class="text-sm text-emerald-600 hover:text-emerald-500"
            type="button"
            @click="resetForm"
          >
            New user
          </button>
        </div>
        <div class="mt-4 overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 text-sm">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-3 py-2 text-left font-medium text-gray-500">Name</th>
                <th class="px-3 py-2 text-left font-medium text-gray-500">Email</th>
                <th class="px-3 py-2 text-left font-medium text-gray-500">Username</th>
                <th class="px-3 py-2 text-left font-medium text-gray-500">Created at</th>
                <th class="px-3 py-2 text-right font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 bg-white">
              <tr v-if="loadingUsers">
                <td class="px-3 py-4 text-center text-gray-500" colspan="5">Loading...</td>
              </tr>
              <tr v-for="user in sortedUsers" v-else :key="user.id">
                <td class="px-3 py-2 font-medium text-gray-900">{{ user.name }}</td>
                <td class="px-3 py-2 text-gray-700">{{ user.email }}</td>
                <td class="px-3 py-2 text-gray-700">{{ user.username }}</td>
                <td class="px-3 py-2 text-gray-500">
                  {{ new Date(user.createdAt).toLocaleString() }}
                </td>
                <td class="px-3 py-2 text-right">
                  <button class="text-emerald-600 mr-3" type="button" @click="startEdit(user)">Edit</button>
                  <button class="text-red-500" type="button" @click="deleteUser(user.id)">Delete</button>
                </td>
              </tr>
              <tr v-if="!loadingUsers && !sortedUsers.length">
                <td class="px-3 py-4 text-center text-gray-500" colspan="5">No users yet</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 class="text-lg font-semibold text-gray-900">
          {{ editingUserId ? 'Edit user' : 'Create user' }}
        </h2>
        <form class="mt-4 grid gap-4 sm:grid-cols-2" @submit.prevent="submitUserForm">
          <label class="flex flex-col gap-1 text-sm text-gray-700">
            Name
            <input
              v-model="userForm.name"
              required
              class="rounded border border-gray-300 px-3 py-2 focus:border-emerald-500 focus:outline-none"
            />
          </label>
          <label class="flex flex-col gap-1 text-sm text-gray-700">
            Email
            <input
              v-model="userForm.email"
              type="email"
              required
              class="rounded border border-gray-300 px-3 py-2 focus:border-emerald-500 focus:outline-none"
            />
          </label>
          <label class="flex flex-col gap-1 text-sm text-gray-700">
            Username
            <input
              v-model="userForm.username"
              required
              class="rounded border border-gray-300 px-3 py-2 focus:border-emerald-500 focus:outline-none"
            />
          </label>
          <label class="flex flex-col gap-1 text-sm text-gray-700">
            {{ editingUserId ? 'New password (optional)' : 'Password' }}
            <input
              v-model="userForm.password"
              :required="!editingUserId"
              type="password"
              class="rounded border border-gray-300 px-3 py-2 focus:border-emerald-500 focus:outline-none"
            />
          </label>
          <div class="sm:col-span-2 flex items-center gap-3">
            <button
              class="rounded bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 hover:bg-emerald-400"
              type="submit"
            >
              {{ editingUserId ? 'Save' : 'Create user' }}
            </button>
            <button
              v-if="editingUserId"
              class="text-sm text-gray-500"
              type="button"
              @click="resetForm"
            >
              Cancel
            </button>
            <p v-if="formError" class="text-sm text-red-600">{{ formError }}</p>
          </div>
        </form>
      </section>

      <section class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 class="text-lg font-semibold text-gray-900">Admin password</h2>
        <p class="text-sm text-gray-500">Signed in as: {{ session.me?.['username'] }}</p>
        <form class="mt-4 grid gap-4 sm:grid-cols-2" @submit.prevent="updateAdminPassword">
          <label class="flex flex-col gap-1 text-sm text-gray-700">
            Current password
            <input
              v-model="adminPasswordForm.currentPassword"
              type="password"
              required
              class="rounded border border-gray-300 px-3 py-2 focus:border-emerald-500 focus:outline-none"
            />
          </label>
          <label class="flex flex-col gap-1 text-sm text-gray-700">
            New password
            <input
              v-model="adminPasswordForm.newPassword"
              type="password"
              required
              minlength="6"
              class="rounded border border-gray-300 px-3 py-2 focus:border-emerald-500 focus:outline-none"
            />
          </label>
          <div class="sm:col-span-2 flex items-center gap-3">
            <button
              class="rounded bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 hover:bg-emerald-400"
              type="submit"
            >
              Update password
            </button>
            <p v-if="adminPasswordMessage" class="text-sm text-emerald-600">
              {{ adminPasswordMessage }}
            </p>
            <p v-if="adminPasswordError" class="text-sm text-red-600">
              {{ adminPasswordError }}
            </p>
          </div>
        </form>
      </section>
    </div>
  </div>
</template>

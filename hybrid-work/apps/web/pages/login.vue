<script setup lang="ts">
import { reactive, ref } from 'vue';
import { definePageMeta, useRouter } from '#imports';
import { useSession } from '~/stores/session';

const router = useRouter();
const session = useSession();
definePageMeta({ layout: false });
const form = reactive({
  username: 'admin',
  password: 'admin',
});
const isSubmitting = ref(false);
const error = ref('');

async function handleSubmit() {
  error.value = '';
  isSubmitting.value = true;
  try {
    await session.login(form.username.trim(), form.password);
    if (!session.me) {
      await session.fetchMe();
    }
    await router.push('/chat');
  } catch {
    error.value = 'Invalid username or password';
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 px-4">
    <form class="w-full max-w-sm rounded-lg bg-white p-8 shadow" @submit.prevent="handleSubmit">
      <div class="mb-6 text-center">
        <h1 class="text-2xl font-semibold text-gray-900">Hybrid Work Login</h1>
        <p class="text-sm text-gray-500 mt-1">Sign in with the admin account to manage users, or use a member account for the workspace.</p>
      </div>

      <label class="flex flex-col gap-2 text-sm font-medium text-gray-700">
        Username
        <input
          v-model="form.username"
          type="text"
          class="rounded border border-gray-300 px-3 py-2 text-gray-900 focus:border-emerald-500 focus:outline-none"
          placeholder="admin"
          required
        />
      </label>

      <label class="mt-4 flex flex-col gap-2 text-sm font-medium text-gray-700">
        Password
        <input
          v-model="form.password"
          type="password"
          class="rounded border border-gray-300 px-3 py-2 text-gray-900 focus:border-emerald-500 focus:outline-none"
          placeholder="••••••"
          required
        />
      </label>

      <p v-if="error" class="mt-3 text-sm text-red-600">
        {{ error }}
      </p>

      <button
        class="mt-6 w-full rounded bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 hover:bg-emerald-400 disabled:opacity-50"
        type="submit"
        :disabled="isSubmitting"
      >
        {{ isSubmitting ? 'Signing in...' : 'Sign in' }}
      </button>
    </form>
  </div>
</template>

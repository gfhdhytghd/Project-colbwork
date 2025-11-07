<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from '#imports';
import { useSession } from '~/stores/session';

const session = useSession();
const router = useRouter();

const navLinks = [
  { to: '/chat', label: 'Chat' },
  { to: '/calendar', label: 'Calendar' },
  { to: '/office', label: 'Office' },
];

const isAdmin = computed(() => session.me && session.me['role'] === 'ADMIN');
const displayName = computed(() => session.me?.['name'] ?? '用户');
const displayEmail = computed(() => session.me?.['email'] ?? session.me?.['username'] ?? '');

async function logout() {
  session.logout();
  await router.push('/login');
}
</script>

<template>
  <div class="min-h-screen h-screen bg-white text-gray-900 flex flex-col">
    <header class="border-b border-gray-200 bg-white">
      <nav class="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-6 py-4">
        <NuxtLink to="/chat" class="font-semibold">Hybrid Work</NuxtLink>
        <div class="flex flex-1 items-center justify-between gap-6 text-sm">
          <div class="flex gap-4">
            <NuxtLink v-for="item in navLinks" :key="item.to" :to="item.to" class="hover:text-emerald-600">
              {{ item.label }}
            </NuxtLink>
            <NuxtLink v-if="isAdmin" to="/admin" class="text-emerald-600 font-medium">Admin</NuxtLink>
          </div>
          <div class="flex items-center gap-4">
            <div class="text-right text-xs">
              <p class="font-semibold text-gray-900">{{ displayName }}</p>
              <p class="text-gray-500">{{ displayEmail }}</p>
            </div>
            <button
              class="rounded border border-gray-200 px-3 py-1 text-xs text-gray-700 hover:border-emerald-400 hover:text-emerald-600"
              type="button"
              @click="logout"
            >
              退出
            </button>
          </div>
        </div>
      </nav>
    </header>
    <main class="flex flex-1 min-h-0 h-full bg-white">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
const demoUserEmail = useState('demoUserEmail', () => 'alice@acme.com');

const demoUsers = [
  { label: 'Alice Example', value: 'alice@acme.com' },
  { label: 'Bob Example', value: 'bob@acme.com' },
];
</script>

<template>
  <div class="min-h-screen h-screen bg-white text-gray-900 flex flex-col">
    <header class="border-b border-gray-200 bg-white">
      <nav class="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-6 py-4">
        <NuxtLink to="/" class="font-semibold">Hybrid Work</NuxtLink>
        <div class="flex items-center gap-6 text-sm">
          <div class="flex gap-4">
            <NuxtLink to="/chat">Chat</NuxtLink>
            <NuxtLink to="/calendar">Calendar</NuxtLink>
            <NuxtLink to="/office">Office</NuxtLink>
          </div>
          <div class="flex items-center gap-2 text-xs text-gray-600">
            <span>Acting as</span>
            <select
              v-model="demoUserEmail"
              class="rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900"
            >
              <option v-for="user in demoUsers" :key="user.value" :value="user.value">
                {{ user.label }}
              </option>
            </select>
          </div>
        </div>
      </nav>
    </header>
    <main class="flex flex-1 min-h-0 h-full bg-white">
      <slot />
    </main>
  </div>
</template>

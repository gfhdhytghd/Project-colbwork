<script setup lang="ts">
const router = useRouter();
function goToChat() {
  router.push('/chat');
}
</script>

<template>
  <div class="flex flex-1 h-full flex-col items-center justify-center gap-6 bg-white text-gray-900">
    <div class="text-center">
      <h1 class="text-4xl font-semibold">Hybrid Work Collaboration</h1>
      <p class="text-gray-600 mt-2">Chat, shared calendars, and desk orchestration in one place.</p>
    </div>
    <button class="px-4 py-2 rounded bg-emerald-500 text-emerald-950 hover:bg-emerald-400" @click="goToChat">
      Open Workspace
    </button>
  </div>

</template>

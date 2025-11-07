import { defineStore } from 'pinia';

interface SessionState {
  me: Record<string, unknown> | null;
}

export const useSession = defineStore('session', {
  state: (): SessionState => ({
    me: null,
  }),
  actions: {
    async fetchMe() {
      const config = useRuntimeConfig();
      const data = await $fetch('/me', {
        baseURL: config.public.apiBase,
        credentials: 'include',
      });
      this.me = data as Record<string, unknown>;
    },
  },
});

import { defineStore } from 'pinia';
import { useCookie, useRuntimeConfig } from '#imports';
import { $fetch } from 'ofetch';

interface SessionState {
  me: Record<string, unknown> | null;
  token: string | null;
  initialized: boolean;
}

export const useSession = defineStore('session', {
  state: (): SessionState => {
    const tokenCookie = useCookie<string | null>('hw_token');
    return {
      me: null,
      token: tokenCookie.value ?? null,
      initialized: false,
    };
  },
  getters: {
    isAuthenticated: (state) => Boolean(state.me),
  },
  actions: {
    setToken(value: string | null) {
      const tokenCookie = useCookie<string | null>('hw_token', {
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      });
      tokenCookie.value = value;
      this.token = value;
    },
    clearSession() {
      this.me = null;
      this.setToken(null);
    },
    async initialize() {
      if (this.initialized) return;
      const tokenCookie = useCookie<string | null>('hw_token');
      if (tokenCookie.value) {
        this.token = tokenCookie.value;
        try {
          await this.fetchMe();
        } catch {
          this.clearSession();
        }
      }
      this.initialized = true;
    },
    async login(username: string, password: string) {
      const config = useRuntimeConfig();
      const payload = await $fetch<{ accessToken: string; user: Record<string, unknown> }>('/auth/login', {
        baseURL: config.public.apiBase,
        method: 'POST',
        body: { username, password },
      });
      this.setToken(payload.accessToken);
      this.me = payload.user;
      this.initialized = true;
      return payload.user;
    },
    async fetchMe() {
      if (!this.token) {
        this.me = null;
        return null;
      }
      const config = useRuntimeConfig();
      try {
        const data = await $fetch('/me', {
          baseURL: config.public.apiBase,
          headers: { Authorization: `Bearer ${this.token}` },
        });
        this.me = data as Record<string, unknown>;
        return this.me;
      } catch (error) {
        this.clearSession();
        throw error;
      }
    },
    logout() {
      this.clearSession();
    },
  },
});

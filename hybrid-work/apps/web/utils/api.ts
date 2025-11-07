import axios from 'axios';
import { navigateTo, useCookie, useRuntimeConfig } from '#imports';
import { useSession } from '~/stores/session';

let instance: ReturnType<typeof axios.create> | null = null;

export function useApi() {
  const session = useSession();
  const tokenCookie = useCookie<string | null>('hw_token');
  if (!instance) {
    const config = useRuntimeConfig();
    instance = axios.create({
      baseURL: config.public.apiBase,
      withCredentials: false,
    });

    instance.interceptors.request.use((request) => {
      const token = session.token ?? tokenCookie.value;
      if (token) {
        request.headers = {
          ...request.headers,
          Authorization: `Bearer ${token}`,
        };
      }
      return request;
    });

    instance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          session.logout();
          if (process.client) {
            navigateTo('/login');
          }
        }
        return Promise.reject(error);
      },
    );
  }
  return instance;
}

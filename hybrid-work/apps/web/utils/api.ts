import axios from 'axios';
import { useRuntimeConfig, useState } from '#imports';

let instance: ReturnType<typeof axios.create> | null = null;

export function useApi() {
  const demoUserEmail = useState('demoUserEmail', () => 'alice@acme.com');
  if (!instance) {
    const config = useRuntimeConfig();
    instance = axios.create({
      baseURL: config.public.apiBase,
      withCredentials: true,
    });

    instance.interceptors.request.use((request) => {
      const email = demoUserEmail.value;
      if (email) {
        request.headers = {
          ...request.headers,
          'x-demo-user': email,
        };
      }
      return request;
    });
  }
  return instance;
}

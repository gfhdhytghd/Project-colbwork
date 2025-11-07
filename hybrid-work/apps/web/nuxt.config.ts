import { defineNuxtConfig } from 'nuxt/config';

export default defineNuxtConfig({
  css: ['~/assets/tailwind.css', '~/assets/fullcalendar.css'],
  modules: ['@pinia/nuxt'],
  pages: true,
  typescript: {
    strict: true,
    shim: false,
  },
  pinia: {
    storesDirs: ['./stores'],
  },
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:3000',
    },
  },
  compatibilityDate: '2025-11-05',
  nitro: {
    preset: 'node-server',
  },
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },
});

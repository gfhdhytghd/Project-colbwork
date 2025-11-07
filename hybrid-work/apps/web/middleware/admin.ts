import { navigateTo } from '#imports';
import { useSession } from '~/stores/session';

export default defineNuxtRouteMiddleware(() => {
  const session = useSession();
  if (!session.me) {
    return navigateTo('/login');
  }
  if (session.me['role'] !== 'ADMIN') {
    return navigateTo('/chat');
  }
});

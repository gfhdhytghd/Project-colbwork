import { navigateTo } from '#imports';
import { useSession } from '~/stores/session';

export default defineNuxtRouteMiddleware(async (to) => {
  const session = useSession();
  if (!session.initialized) {
    await session.initialize();
  }

  if (to.path === '/login') {
    if (session.isAuthenticated) {
      return navigateTo('/chat');
    }
    return;
  }

  if (!session.isAuthenticated) {
    return navigateTo('/login');
  }
});

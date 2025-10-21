import { computed, ref } from 'vue';

import type { UserDto } from '@vpwa/shared';

const currentUser = ref<UserDto | null>(null);

export const useSession = () => {
  const isAuthenticated = computed(() => currentUser.value !== null);

  const setUser = (user: UserDto | null) => {
    currentUser.value = user;
    if (user) {
      localStorage.setItem('workspace:user', JSON.stringify(user));
    } else {
      localStorage.removeItem('workspace:user');
    }
  };

  const hydrateFromStorage = () => {
    if (currentUser.value) {
      return;
    }

    const stored = localStorage.getItem('workspace:user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as UserDto;
        currentUser.value = parsed;
      } catch (error) {
        console.warn('Unable to restore session', error);
        localStorage.removeItem('workspace:user');
      }
    }
  };

  return {
    user: currentUser,
    isAuthenticated,
    setUser,
    hydrateFromStorage
  };
};

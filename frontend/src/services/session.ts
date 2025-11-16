import type { UserDto } from '@vpwa/shared';

const STORAGE_KEY = 'vpwa.currentUser';

const isBrowser = typeof window !== 'undefined';

export const loadCurrentUser = (): UserDto | null => {
  if (!isBrowser) {
    return null;
  }

  const storedValue = window.localStorage.getItem(STORAGE_KEY);
  if (!storedValue) {
    return null;
  }

  try {
    return JSON.parse(storedValue) as UserDto;
  } catch (error) {
    console.warn('Unable to parse stored user session', error);
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
};

export const saveCurrentUser = (user: UserDto) => {
  if (!isBrowser) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
};

export const clearCurrentUser = () => {
  if (!isBrowser) {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
};

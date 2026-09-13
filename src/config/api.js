export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://187.127.155.161';

export const API_URL = (path) => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
};

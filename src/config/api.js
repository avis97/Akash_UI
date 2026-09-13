export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://187.127.155.161:5005';

export const API_URL = (path) => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
};

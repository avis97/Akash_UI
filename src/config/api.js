export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://187.127.155.161';

export const API_URL = (path) => {
  if (!path) return API_BASE_URL;
  if (typeof path === 'string' && (path.startsWith('http://') || path.startsWith('https://'))) {
    return path;
  }
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
};

// Global fetch override: automatically redirect any relative '/api/...' request to target target IP (https://187.127.155.161)
if (typeof window !== 'undefined' && window.fetch && !window.__api_fetch_intercepted__) {
  window.__api_fetch_intercepted__ = true;
  const originalFetch = window.fetch;
  window.fetch = function (resource, options) {
    if (typeof resource === 'string') {
      if (resource.startsWith('/api') || resource.startsWith('api/')) {
        resource = API_URL(resource);
      }
    } else if (resource && typeof resource === 'object' && resource.url) {
      if (resource.url.startsWith('/api') || resource.url.startsWith('api/')) {
        const newUrl = API_URL(resource.url);
        resource = new Request(newUrl, resource);
      }
    }
    return originalFetch.call(this, resource, options);
  };
}


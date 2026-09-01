// Claude artifacts expose window.storage; a normal web/PWA does not.
// Provide the same tiny async interface on top of localStorage so the
// existing application keeps its progress-saving logic unchanged.
if (typeof window !== 'undefined' && !window.storage) {
  window.storage = {
    async get(key) {
      const value = window.localStorage.getItem(key);
      return value === null ? null : { value };
    },
    async set(key, value) {
      window.localStorage.setItem(key, value);
      return { value };
    },
    async delete(key) {
      window.localStorage.removeItem(key);
      return { value: null };
    },
  };
}

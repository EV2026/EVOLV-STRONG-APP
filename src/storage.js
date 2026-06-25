import { Preferences } from '@capacitor/preferences';

const storage = {
  async get(key) {
    try {
      const { value } = await Preferences.get({ key });
      return value ? { key, value } : null;
    } catch {
      const value = localStorage.getItem(key);
      return value ? { key, value } : null;
    }
  },
  async set(key, value) {
    try {
      await Preferences.set({ key, value });
      return { key, value };
    } catch {
      localStorage.setItem(key, value);
      return { key, value };
    }
  },
  async delete(key) {
    try {
      await Preferences.remove({ key });
      return { key, deleted: true };
    } catch {
      localStorage.removeItem(key);
      return { key, deleted: true };
    }
  }
};

window.storage = storage;
export default storage;
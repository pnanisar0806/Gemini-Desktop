import Store from 'electron-store';
import { AppSettings, DEFAULT_SETTINGS } from '../shared/types';

const store = new Store<AppSettings>({
  defaults: DEFAULT_SETTINGS,
  name: 'settings',
});

export function getSetting<K extends keyof AppSettings>(key: K): AppSettings[K] {
  return store.get(key);
}

export function setSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]): void {
  store.set(key, value);
}

export function getAllSettings(): AppSettings {
  return store.store;
}

export function resetSettings(): void {
  store.clear();
}

export { store as settingsStore };

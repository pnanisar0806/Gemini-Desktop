export interface AppSettings {
  startAtLogin: boolean;
  closeToTray: boolean;
  launchInBackground: boolean;

  theme: 'system' | 'light' | 'dark';
  zoomLevel: number;

  globalShortcut: string;
  newConversationShortcut: string;

  notificationsEnabled: boolean;
  notificationSound: boolean;

  geminiUrl: string;

  windowBounds: {
    x?: number;
    y?: number;
    width: number;
    height: number;
    isMaximized: boolean;
  };

  hasSeenShortcutHint: boolean;
  hasSeenTrayHint: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  startAtLogin: false,
  closeToTray: false,
  launchInBackground: false,
  theme: 'system',
  zoomLevel: 1.0,
  globalShortcut: 'Alt+Space',
  newConversationShortcut: 'CmdOrCtrl+Shift+G',
  notificationsEnabled: true,
  notificationSound: false,
  geminiUrl: 'https://gemini.google.com',
  windowBounds: {
    width: 1200,
    height: 800,
    isMaximized: false,
  },
  hasSeenShortcutHint: false,
  hasSeenTrayHint: false,
};

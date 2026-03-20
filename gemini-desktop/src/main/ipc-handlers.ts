import { ipcMain, BrowserWindow, app, session } from 'electron';
import { IPC_CHANNELS } from '../shared/channels';
import { getSetting, setSetting, getAllSettings, resetSettings } from './settings-store';
import { applyTheme } from './theme-manager';
import { registerGlobalShortcuts } from './shortcut-manager';
import { installUpdate, checkForUpdates } from './auto-updater';
import { updateTrayMenu } from './tray-manager';
import { AppSettings } from '../shared/types';

export function setupIpcHandlers(): void {
  // Window management
  ipcMain.on(IPC_CHANNELS.WINDOW_MINIMIZE, (event) => {
    BrowserWindow.fromWebContents(event.sender)?.minimize();
  });

  ipcMain.on(IPC_CHANNELS.WINDOW_MAXIMIZE, (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
      win.isMaximized() ? win.unmaximize() : win.maximize();
    }
  });

  ipcMain.on(IPC_CHANNELS.WINDOW_CLOSE, (event) => {
    BrowserWindow.fromWebContents(event.sender)?.close();
  });

  ipcMain.handle(IPC_CHANNELS.WINDOW_IS_MAXIMIZED, (event) => {
    return BrowserWindow.fromWebContents(event.sender)?.isMaximized() ?? false;
  });

  // Theme
  ipcMain.handle(IPC_CHANNELS.THEME_GET, () => getSetting('theme'));

  ipcMain.on(IPC_CHANNELS.THEME_SET, (event, theme: 'system' | 'light' | 'dark') => {
    setSetting('theme', theme);
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) applyTheme(win);
  });

  // Settings
  ipcMain.handle(IPC_CHANNELS.SETTINGS_GET, (_event, key: keyof AppSettings) => getSetting(key));
  ipcMain.handle(IPC_CHANNELS.SETTINGS_GET_ALL, () => getAllSettings());

  ipcMain.on(IPC_CHANNELS.SETTINGS_SET, (event, key: keyof AppSettings, value: any) => {
    setSetting(key, value);

    if (key === 'theme') {
      const win = BrowserWindow.fromWebContents(event.sender);
      if (win) applyTheme(win);
    }
    if (key === 'globalShortcut' || key === 'newConversationShortcut') {
      registerGlobalShortcuts();
    }
    if (key === 'startAtLogin') {
      app.setLoginItemSettings({ openAtLogin: value as boolean });
      updateTrayMenu();
    }
    if (key === 'zoomLevel') {
      const win = BrowserWindow.fromWebContents(event.sender);
      if (win) win.webContents.setZoomFactor(value as number);
    }
  });

  ipcMain.on(IPC_CHANNELS.SETTINGS_RESET, () => {
    resetSettings();
    registerGlobalShortcuts();
    updateTrayMenu();
  });

  // App lifecycle
  ipcMain.handle(IPC_CHANNELS.APP_VERSION, () => app.getVersion());

  ipcMain.handle(IPC_CHANNELS.APP_CLEAR_DATA, async () => {
    const ses = session.fromPartition('persist:gemini');
    await ses.clearStorageData();
    await ses.clearCache();
    return true;
  });

  // Updates
  ipcMain.on(IPC_CHANNELS.UPDATE_INSTALL, () => installUpdate());
  ipcMain.on(IPC_CHANNELS.UPDATE_CHECK, () => checkForUpdates());
}

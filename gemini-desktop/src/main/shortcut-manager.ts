import { globalShortcut, BrowserWindow } from 'electron';
import { getSetting } from './settings-store';
import { getMainWindow, createWindow } from './window-manager';

let registeredShortcuts: string[] = [];

export function registerGlobalShortcuts(): void {
  unregisterAll();

  const shortcut = getSetting('globalShortcut');
  const newConvShortcut = getSetting('newConversationShortcut');

  // Global summon shortcut
  if (shortcut) {
    const registered = globalShortcut.register(shortcut, () => {
      const win = getMainWindow();
      if (!win) {
        createWindow();
        return;
      }
      if (win.isVisible() && win.isFocused()) {
        win.hide();
      } else {
        win.show();
        win.focus();
      }
    });
    if (registered) {
      registeredShortcuts.push(shortcut);
    }
  }

  // New conversation shortcut
  if (newConvShortcut) {
    const registered = globalShortcut.register(newConvShortcut, () => {
      const win = getMainWindow();
      if (win) {
        win.show();
        win.focus();
        win.webContents.send('nav:new-conversation');
      } else {
        createWindow();
      }
    });
    if (registered) {
      registeredShortcuts.push(newConvShortcut);
    }
  }
}

export function unregisterAll(): void {
  for (const shortcut of registeredShortcuts) {
    globalShortcut.unregister(shortcut);
  }
  registeredShortcuts = [];
}

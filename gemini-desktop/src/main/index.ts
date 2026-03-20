import { app, BrowserWindow, Notification } from 'electron';
import { createWindow, getMainWindow } from './window-manager';
import { showResponseNotification } from './notification-manager';
import { createTray } from './tray-manager';
import { registerGlobalShortcuts, unregisterAll } from './shortcut-manager';
import { setupIpcHandlers } from './ipc-handlers';
import { createAppMenu } from './menu';
import { applyTheme, setupThemeListener } from './theme-manager';
import { setupDeepLinkHandler } from './deeplink-handler';
import { setupAutoUpdater } from './auto-updater';
import { getSetting, setSetting } from './settings-store';
import { APP_PROTOCOL } from './constants';

// Track whether we're force-quitting (from tray menu "Quit" or app.exit)
let forceQuit = false;
export function setForceQuit(val: boolean) { forceQuit = val; }

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  // Register protocol for deep linking
  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient(APP_PROTOCOL, process.execPath, [
        require('path').resolve(process.argv[1]),
      ]);
    }
  } else {
    app.setAsDefaultProtocolClient(APP_PROTOCOL);
  }

  setupDeepLinkHandler();

  app.on('ready', () => {
    setupIpcHandlers();
    createAppMenu();

    const win = createWindow();

    createTray();
    registerGlobalShortcuts();

    applyTheme(win);
    setupThemeListener(win);

    if (app.isPackaged) {
      setupAutoUpdater(win);
    }

    // Notifications on page title change
    win.webContents.on('page-title-updated', (_event, title) => {
      showResponseNotification(win, title);
    });

    // Handle close button behavior
    win.on('close', (event) => {
      if (forceQuit) {
        // Let it close normally
        return;
      }

      if (getSetting('closeToTray')) {
        // Hide to tray instead of quitting
        event.preventDefault();
        win.hide();

        if (!getSetting('hasSeenTrayHint')) {
          new Notification({
            title: 'Gemini Desktop',
            body: 'Gemini Desktop is still running in the background. Click the tray icon to open.',
          }).show();
          setSetting('hasSeenTrayHint', true);
        }
      }
      // If closeToTray is false, the window closes and app quits normally
    });

    // Show shortcut hint on first launch
    win.webContents.once('did-finish-load', () => {
      if (!getSetting('hasSeenShortcutHint')) {
        const shortcut = getSetting('globalShortcut');
        setTimeout(() => {
          win.webContents.executeJavaScript(`
            (function() {
              const hint = document.createElement('div');
              hint.style.cssText = 'position:fixed;top:44px;left:50%;transform:translateX(-50%);z-index:9999999;padding:8px 16px;background:#3b82f6;color:white;font-size:13px;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.3);font-family:Segoe UI,sans-serif;transition:opacity 0.3s;';
              hint.innerHTML = 'Tip: Press <kbd style="padding:2px 6px;background:rgba(255,255,255,0.2);border-radius:4px;font-family:monospace;font-size:12px;">${shortcut}</kbd> to summon Gemini from anywhere';
              document.body.appendChild(hint);
              setTimeout(() => { hint.style.opacity = '0'; setTimeout(() => hint.remove(), 300); }, 5000);
            })();
          `).catch(() => {});
          setSetting('hasSeenShortcutHint', true);
        }, 3000);
      }
    });
  });

  app.on('window-all-closed', () => {
    app.quit();
  });

  app.on('activate', () => {
    const win = getMainWindow();
    if (win) {
      win.show();
    } else {
      createWindow();
    }
  });

  app.on('will-quit', () => {
    unregisterAll();
  });
}

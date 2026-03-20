import { Tray, Menu, app, nativeImage } from 'electron';
import path from 'path';
import { getMainWindow, createWindow } from './window-manager';
import { getSetting, setSetting } from './settings-store';
import { setForceQuit } from './index';

let tray: Tray | null = null;

export function createTray(): Tray {
  const iconPath = path.join(__dirname, '../../assets/icons/icon.ico');
  tray = new Tray(nativeImage.createFromPath(iconPath));
  tray.setToolTip('Gemini Desktop');

  updateTrayMenu();

  tray.on('click', () => {
    const win = getMainWindow();
    if (win) {
      if (win.isVisible()) {
        win.hide();
      } else {
        win.show();
        win.focus();
      }
    } else {
      createWindow();
    }
  });

  return tray;
}

export function updateTrayMenu(): void {
  if (!tray) return;

  const startAtLogin = getSetting('startAtLogin');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open Gemini',
      click: () => {
        const win = getMainWindow();
        if (win) {
          win.show();
          win.focus();
        } else {
          createWindow();
        }
      },
    },
    {
      label: 'New Conversation',
      click: () => {
        createWindow();
      },
    },
    { type: 'separator' },
    {
      label: 'Start at Login',
      type: 'checkbox',
      checked: startAtLogin,
      click: (menuItem) => {
        setSetting('startAtLogin', menuItem.checked);
        app.setLoginItemSettings({ openAtLogin: menuItem.checked });
      },
    },
    {
      label: 'Settings...',
      click: () => {
        const win = getMainWindow();
        if (win) {
          win.show();
          win.focus();
          win.webContents.send('settings-panel:toggle');
        }
      },
    },
    { type: 'separator' },
    {
      label: 'Check for Updates',
      click: () => {
        // Will be wired to auto-updater
      },
    },
    {
      label: 'About Gemini Desktop',
      click: () => {
        const { dialog } = require('electron');
        dialog.showMessageBox({
          type: 'info',
          title: 'About Gemini Desktop',
          message: `Gemini Desktop v${app.getVersion()}`,
          detail: `Electron: ${process.versions.electron}\nChromium: ${process.versions.chrome}\nNode.js: ${process.versions.node}`,
        });
      },
    },
    { type: 'separator' },
    {
      label: 'Quit Gemini Desktop',
      click: () => {
        setForceQuit(true);
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
}

export function getTray(): Tray | null {
  return tray;
}

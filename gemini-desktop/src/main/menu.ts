import { Menu, app, BrowserWindow, dialog, session, shell } from 'electron';
import { getMainWindow, createWindow, getGeminiUrl } from './window-manager';
import { GEMINI_NEW_CHAT_URL } from './constants';
import { setForceQuit } from './index';

export function createAppMenu(): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Window',
          accelerator: 'CmdOrCtrl+N',
          click: () => createWindow(),
        },
        {
          label: 'New Conversation',
          accelerator: 'CmdOrCtrl+Shift+N',
          click: () => {
            const win = getMainWindow();
            if (win) win.loadURL(GEMINI_NEW_CHAT_URL);
          },
        },
        { type: 'separator' },
        {
          label: 'Close Window',
          accelerator: 'CmdOrCtrl+W',
          click: () => BrowserWindow.getFocusedWindow()?.close(),
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: 'CmdOrCtrl+Q',
          click: () => { setForceQuit(true); app.quit(); },
        },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
        { type: 'separator' },
        {
          label: 'Clear Browsing Data...',
          click: async () => {
            const win = getMainWindow();
            if (!win) return;
            const result = await dialog.showMessageBox(win, {
              type: 'warning',
              title: 'Clear Browsing Data',
              message: 'This will clear all cookies, cache, and session data. You will be signed out of Google.',
              buttons: ['Cancel', 'Clear Data'],
              defaultId: 0,
              cancelId: 0,
            });
            if (result.response === 1) {
              const ses = session.fromPartition('persist:gemini');
              await ses.clearStorageData();
              await ses.clearCache();
              win.loadURL(getGeminiUrl());
            }
          },
        },
      ],
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          click: () => getMainWindow()?.webContents.reload(),
        },
        {
          label: 'Force Reload',
          accelerator: 'CmdOrCtrl+Shift+R',
          click: () => getMainWindow()?.webContents.reloadIgnoringCache(),
        },
        { type: 'separator' },
        {
          label: 'Actual Size',
          accelerator: 'CmdOrCtrl+0',
          click: () => getMainWindow()?.webContents.setZoomFactor(1.0),
        },
        {
          label: 'Zoom In',
          accelerator: 'CmdOrCtrl+=',
          click: () => {
            const win = getMainWindow();
            if (win) win.webContents.setZoomFactor(Math.min(win.webContents.getZoomFactor() + 0.1, 2.0));
          },
        },
        {
          label: 'Zoom Out',
          accelerator: 'CmdOrCtrl+-',
          click: () => {
            const win = getMainWindow();
            if (win) win.webContents.setZoomFactor(Math.max(win.webContents.getZoomFactor() - 0.1, 0.5));
          },
        },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        { type: 'separator' },
        { role: 'toggleDevTools' },
      ],
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Gemini Help',
          click: () => shell.openExternal('https://support.google.com/gemini'),
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

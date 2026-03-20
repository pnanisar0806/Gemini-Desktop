import { nativeTheme, BrowserWindow } from 'electron';
import { getSetting } from './settings-store';

export function applyTheme(win: BrowserWindow): void {
  const mode = getSetting('theme');
  nativeTheme.themeSource = mode;

  const isDark = mode === 'dark' || (mode === 'system' && nativeTheme.shouldUseDarkColors);

  win.webContents.insertCSS(`
    :root { color-scheme: ${isDark ? 'dark' : 'light'} !important; }
  `).catch(() => {});
}

export function setupThemeListener(win: BrowserWindow): void {
  nativeTheme.on('updated', () => {
    applyTheme(win);
  });
}

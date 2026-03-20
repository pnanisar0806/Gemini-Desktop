import { app, BrowserWindow } from 'electron';
import { getMainWindow, createWindow } from './window-manager';
import { GEMINI_NEW_CHAT_URL } from './constants';

export function setupDeepLinkHandler(): void {
  // Handle protocol on Windows (via second-instance)
  app.on('second-instance', (_event, commandLine) => {
    const url = commandLine.find((arg) => arg.startsWith('gemini-desktop://'));
    if (url) {
      handleDeepLink(url);
    } else {
      // Just focus the existing window
      const win = getMainWindow();
      if (win) {
        if (win.isMinimized()) win.restore();
        win.show();
        win.focus();
      }
    }
  });
}

export function handleDeepLink(url: string): void {
  const parsed = new URL(url);
  const win = getMainWindow() || createWindow();

  switch (parsed.hostname) {
    case 'open':
      win.show();
      win.focus();
      break;

    case 'new':
      win.show();
      win.focus();
      win.webContents.send('nav:new-conversation');
      break;

    case 'prompt': {
      const text = parsed.searchParams.get('text');
      if (text) {
        win.show();
        win.focus();
        // Navigate to new chat and the renderer will handle pre-filling
        win.webContents.send('nav:new-conversation', text);
      }
      break;
    }

    default:
      win.show();
      win.focus();
      break;
  }
}

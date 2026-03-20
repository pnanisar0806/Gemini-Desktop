import { BrowserWindow, shell, session } from 'electron';
import path from 'path';
import { getSetting, setSetting } from './settings-store';
import { GEMINI_URL, GOOGLE_DOMAINS, USER_AGENT } from './constants';

const windows: Set<BrowserWindow> = new Set();
let mainWindow: BrowserWindow | null = null;

function isGoogleDomain(url: string): boolean {
  try {
    const hostname = new URL(url).hostname;
    return GOOGLE_DOMAINS.some((d) => hostname.endsWith(d));
  } catch {
    return false;
  }
}

export function createWindow(): BrowserWindow {
  const bounds = getSetting('windowBounds');
  const geminiUrl = getSetting('geminiUrl') || GEMINI_URL;

  const win = new BrowserWindow({
    width: bounds.width || 1200,
    height: bounds.height || 800,
    minWidth: 800,
    minHeight: 600,
    x: bounds.x,
    y: bounds.y,
    title: 'Gemini Desktop',
    backgroundColor: '#131314',
    icon: path.join(__dirname, '../../assets/icons/icon.ico'),
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      partition: 'persist:gemini',
    },
  });

  // Set user agent on the persistent session
  const ses = session.fromPartition('persist:gemini');
  ses.setUserAgent(USER_AGENT);

  if (bounds.isMaximized) {
    win.maximize();
  }

  // Load Gemini directly
  win.loadURL(geminiUrl);

  win.once('ready-to-show', () => {
    win.show();
  });

  // Save window bounds on move/resize
  const saveBounds = () => {
    if (!win.isMaximized() && !win.isMinimized()) {
      const b = win.getBounds();
      setSetting('windowBounds', {
        x: b.x,
        y: b.y,
        width: b.width,
        height: b.height,
        isMaximized: false,
      });
    }
  };

  win.on('resize', saveBounds);
  win.on('move', saveBounds);
  win.on('maximize', () => {
    const b = getSetting('windowBounds');
    setSetting('windowBounds', { ...b, isMaximized: true });
  });
  win.on('unmaximize', () => {
    const b = getSetting('windowBounds');
    setSetting('windowBounds', { ...b, isMaximized: false });
  });

  // Handle new window requests (OAuth popups, etc.)
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (isGoogleDomain(url)) {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          width: 500,
          height: 700,
          parent: win,
          modal: false,
          webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            partition: 'persist:gemini',
          },
        },
      };
    }
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Prevent navigation to non-Google domains
  win.webContents.on('will-navigate', (event, url) => {
    if (!isGoogleDomain(url)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  win.on('closed', () => {
    windows.delete(win);
    if (win === mainWindow) {
      mainWindow = null;
    }
  });

  windows.add(win);
  if (!mainWindow) {
    mainWindow = win;
  }

  return win;
}

export function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}

export function getAllWindows(): BrowserWindow[] {
  return Array.from(windows);
}

export function getGeminiUrl(): string {
  return getSetting('geminiUrl') || GEMINI_URL;
}

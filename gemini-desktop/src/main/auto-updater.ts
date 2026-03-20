import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import { BrowserWindow } from 'electron';
import { IPC_CHANNELS } from '../shared/channels';
import { UPDATE_CHECK_INTERVAL, UPDATE_INITIAL_DELAY } from './constants';

let mainWindow: BrowserWindow | null = null;

export function setupAutoUpdater(win: BrowserWindow): void {
  mainWindow = win;

  autoUpdater.logger = log;
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('update-available', (info) => {
    mainWindow?.webContents.send(IPC_CHANNELS.UPDATE_AVAILABLE, {
      version: info.version,
      releaseNotes: info.releaseNotes,
    });
  });

  autoUpdater.on('download-progress', (progress) => {
    mainWindow?.webContents.send(IPC_CHANNELS.UPDATE_PROGRESS, {
      percent: progress.percent,
      bytesPerSecond: progress.bytesPerSecond,
      total: progress.total,
      transferred: progress.transferred,
    });
  });

  autoUpdater.on('update-downloaded', () => {
    mainWindow?.webContents.send(IPC_CHANNELS.UPDATE_DOWNLOADED);
  });

  autoUpdater.on('error', (error) => {
    log.error('Auto-updater error:', error);
  });

  // Check after initial delay
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch((err) => log.error('Update check failed:', err));
  }, UPDATE_INITIAL_DELAY);

  // Periodic checks
  setInterval(() => {
    autoUpdater.checkForUpdates().catch((err) => log.error('Update check failed:', err));
  }, UPDATE_CHECK_INTERVAL);
}

export function installUpdate(): void {
  autoUpdater.quitAndInstall();
}

export function checkForUpdates(): void {
  autoUpdater.checkForUpdates().catch((err) => log.error('Update check failed:', err));
}

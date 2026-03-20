import { Notification, BrowserWindow } from 'electron';
import path from 'path';
import { getSetting } from './settings-store';
import { NOTIFICATION_RATE_LIMIT } from './constants';

let lastNotificationTime = 0;

export function showResponseNotification(win: BrowserWindow, title: string): void {
  if (!getSetting('notificationsEnabled')) return;
  if (win.isFocused()) return;

  const now = Date.now();
  if (now - lastNotificationTime < NOTIFICATION_RATE_LIMIT) return;

  const notification = new Notification({
    title: 'Gemini Desktop',
    body: `New response: ${title}`,
    icon: path.join(__dirname, '../../assets/icons/icon.ico'),
  });

  notification.on('click', () => {
    win.show();
    win.focus();
  });

  notification.show();
  lastNotificationTime = now;
}

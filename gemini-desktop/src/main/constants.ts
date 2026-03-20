import path from 'path';

export const GEMINI_URL = 'https://gemini.google.com';
export const GEMINI_NEW_CHAT_URL = 'https://gemini.google.com/app';
export const GOOGLE_DOMAINS = ['.google.com', '.googleapis.com', '.gstatic.com', '.google.co'];

export const APP_PROTOCOL = 'gemini-desktop';

export const TRAY_ICON_PATH = path.join(__dirname, '../../assets/icons/icon.ico');

export const UPDATE_CHECK_INTERVAL = 4 * 60 * 60 * 1000; // 4 hours
export const UPDATE_INITIAL_DELAY = 10 * 1000; // 10 seconds
export const NOTIFICATION_RATE_LIMIT = 5000; // 5 seconds

export const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

# Product Requirements Document: Gemini Desktop App

## Document Info

| Field | Value |
|-------|-------|
| **Project Name** | Gemini Desktop |
| **Version** | 1.0 |
| **Date** | March 2026 |
| **Target Platforms** | macOS (Apple Silicon + Intel), Windows (x64), Linux (x64) |
| **Tech Stack** | Electron 33+, React 19, TypeScript, Vite |

---

## 1. Executive Summary

Google Gemini lacks a native desktop application. Users currently access Gemini through web browsers, which means no system-level keyboard shortcuts, no persistent dock/taskbar presence, no native notifications, and a cluttered tab experience. This project builds a lightweight, polished Electron-based desktop wrapper around Gemini with native OS integrations that make it feel like a first-class desktop citizen — similar to how Claude, ChatGPT, and Slack offer dedicated desktop apps.

---

## 2. Problem Statement

- **No persistent presence**: Gemini lives in a browser tab, easily lost among dozens of other tabs.
- **No global shortcut**: Users cannot summon Gemini instantly from anywhere on their OS.
- **No native notifications**: Browser notifications are unreliable and often blocked.
- **No system tray/menu bar access**: Cannot quickly access Gemini without switching to the browser.
- **No deep linking**: Cannot open Gemini conversations from external apps or scripts.
- **No offline indicator**: No clear UX when connectivity drops.

---

## 3. Target Users

- Power users who interact with Gemini multiple times per day
- Developers who want quick AI access alongside their IDE
- Knowledge workers who use Gemini for writing, research, and brainstorming
- Users who prefer dedicated app windows over browser tabs

---

## 4. Goals & Non-Goals

### Goals

1. Provide a native desktop experience for Google Gemini on macOS, Windows, and Linux
2. Global keyboard shortcut to summon the app from any context
3. System tray / menu bar quick-access
4. Native OS notifications for responses
5. Clean, minimal chrome that maximizes Gemini's interface
6. Auto-update mechanism for seamless upgrades
7. Multi-window and multi-account support
8. Deep link protocol handler (`gemini-desktop://`)
9. Startup launch option
10. Respect OS appearance (dark/light/system theme)

### Non-Goals

- Building a custom Gemini UI from scratch (this is a wrapper, not a reimplementation)
- Providing offline AI capabilities
- Replacing the Gemini web experience
- Mobile builds (iOS/Android)
- Implementing a Gemini API client — this wraps the web UI at `gemini.google.com`

---

## 5. Technical Architecture

### 5.1 High-Level Architecture

```
┌─────────────────────────────────────────────────┐
│                  Electron Main Process           │
│  ┌───────────┐ ┌──────────┐ ┌────────────────┐  │
│  │ Window    │ │ Tray     │ │ Auto-Updater   │  │
│  │ Manager   │ │ Manager  │ │ (electron-     │  │
│  │           │ │          │ │  updater)      │  │
│  └───────────┘ └──────────┘ └────────────────┘  │
│  ┌───────────┐ ┌──────────┐ ┌────────────────┐  │
│  │ Shortcut  │ │ Deep     │ │ Notification   │  │
│  │ Manager   │ │ Link     │ │ Manager        │  │
│  │           │ │ Handler  │ │                │  │
│  └───────────┘ └──────────┘ └────────────────┘  │
│  ┌───────────┐ ┌──────────┐                     │
│  │ Settings  │ │ Theme    │                     │
│  │ Store     │ │ Manager  │                     │
│  │ (electron-│ │          │                     │
│  │  store)   │ │          │                     │
│  └───────────┘ └──────────┘                     │
├─────────────────────────────────────────────────┤
│              Renderer Process(es)                │
│  ┌───────────────────────────────────────────┐  │
│  │  BrowserView / WebView (gemini.google.com)│  │
│  └───────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────┐  │
│  │  Settings UI (React + Tailwind)           │  │
│  └───────────────────────────────────────────┘  │
├─────────────────────────────────────────────────┤
│                  Preload Scripts                  │
│  ┌───────────────────────────────────────────┐  │
│  │  IPC Bridge (contextBridge)               │  │
│  │  - Theme injection                        │  │
│  │  - Notification interception              │  │
│  │  - Navigation control                     │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

### 5.2 Project Structure

```
gemini-desktop/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── electron-builder.yml          # Build & packaging config
├── assets/
│   ├── icons/
│   │   ├── icon.icns             # macOS
│   │   ├── icon.ico              # Windows
│   │   ├── icon.png              # Linux (512x512)
│   │   ├── icon-16.png           # Tray icon variants
│   │   ├── icon-32.png
│   │   └── tray-icon.png         # Monochrome tray icon (22x22)
│   └── sounds/
│       └── notification.wav      # Optional notification sound
├── src/
│   ├── main/
│   │   ├── index.ts              # Electron main entry point
│   │   ├── window-manager.ts     # Window creation & lifecycle
│   │   ├── tray-manager.ts       # System tray / menu bar
│   │   ├── shortcut-manager.ts   # Global keyboard shortcuts
│   │   ├── deeplink-handler.ts   # Protocol handler
│   │   ├── notification-manager.ts
│   │   ├── auto-updater.ts       # electron-updater integration
│   │   ├── theme-manager.ts      # OS theme detection & sync
│   │   ├── settings-store.ts     # Persistent settings (electron-store)
│   │   ├── menu.ts               # Native app menu (File, Edit, View, etc.)
│   │   ├── ipc-handlers.ts       # IPC channel definitions
│   │   └── constants.ts          # App-wide constants
│   ├── preload/
│   │   ├── index.ts              # contextBridge API exposure
│   │   └── gemini-bridge.ts      # Gemini-specific DOM interactions
│   ├── renderer/
│   │   ├── App.tsx               # Root React component
│   │   ├── main.tsx              # React entry point
│   │   ├── components/
│   │   │   ├── TitleBar.tsx      # Custom title bar (frameless window)
│   │   │   ├── SettingsPanel.tsx  # Settings overlay
│   │   │   ├── UpdateBanner.tsx  # Update available notification
│   │   │   ├── OfflineBanner.tsx # Connectivity status
│   │   │   └── Sidebar.tsx       # Optional sidebar for quick actions
│   │   ├── hooks/
│   │   │   ├── useTheme.ts
│   │   │   ├── useSettings.ts
│   │   │   └── useConnectivity.ts
│   │   ├── styles/
│   │   │   └── global.css        # Tailwind + custom overrides
│   │   └── lib/
│   │       └── ipc.ts            # Typed IPC wrappers for renderer
│   └── shared/
│       ├── types.ts              # Shared TypeScript interfaces
│       └── channels.ts           # IPC channel name constants
├── scripts/
│   ├── generate-icons.sh         # Icon generation script
│   └── notarize.js               # macOS notarization script
└── test/
    ├── main/
    │   └── window-manager.test.ts
    └── e2e/
        └── app-launch.test.ts
```

### 5.3 Key Dependencies

```json
{
  "dependencies": {
    "electron-store": "^10.0.0",
    "electron-updater": "^6.3.0",
    "electron-log": "^5.2.0"
  },
  "devDependencies": {
    "electron": "^33.0.0",
    "electron-builder": "^25.0.0",
    "vite": "^6.0.0",
    "@vitejs/plugin-react": "^4.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "typescript": "^5.7.0",
    "tailwindcss": "^4.0.0",
    "@electron/notarize": "^2.5.0",
    "vitest": "^2.0.0",
    "playwright": "^1.50.0"
  }
}
```

---

## 6. Feature Specifications

### 6.1 Core Window & Web View

**Description**: The app loads `https://gemini.google.com` inside a `BrowserView` (preferred over `<webview>` for better security and performance). The window should feel native with minimal wrapper chrome.

**Requirements**:

- **F-WIN-01**: Load `https://gemini.google.com` in a `BrowserView` attached to the main `BrowserWindow`.
- **F-WIN-02**: On macOS, use a frameless window with `titleBarStyle: 'hiddenInset'` to show native traffic lights. On Windows/Linux, use a custom title bar component with minimize/maximize/close buttons.
- **F-WIN-03**: Persist window size, position, and maximized state across restarts using `electron-store`. Default size: `1200x800`, minimum size: `800x600`.
- **F-WIN-04**: Handle the BrowserView's navigation to prevent external links from opening inside the app. External links (anything not on `*.google.com`) should open in the user's default browser via `shell.openExternal()`.
- **F-WIN-05**: Inject a user-agent string that identifies as a standard Chrome browser to avoid any Gemini-side restrictions on Electron.
- **F-WIN-06**: Support standard browser behaviors: zoom in/out (`Cmd/Ctrl + +/-/0`), find in page (`Cmd/Ctrl + F`), back/forward navigation.
- **F-WIN-07**: Clear cache and cookies via a menu option (Edit > Clear Browsing Data) with a confirmation dialog.
- **F-WIN-08**: Support multiple windows. `Cmd/Ctrl + N` opens a new window with a fresh Gemini session.

**Implementation Notes**:

```typescript
// window-manager.ts — key configuration
const mainWindow = new BrowserWindow({
  width: storedBounds.width || 1200,
  height: storedBounds.height || 800,
  minWidth: 800,
  minHeight: 600,
  x: storedBounds.x,
  y: storedBounds.y,
  titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
  frame: process.platform === 'darwin',
  trafficLightPosition: { x: 16, y: 16 },
  backgroundColor: '#1a1a2e', // Prevent white flash
  webPreferences: {
    preload: path.join(__dirname, '../preload/index.js'),
    contextIsolation: true,
    nodeIntegration: false,
    sandbox: true,
  },
});

// BrowserView for Gemini
const geminiView = new BrowserView({
  webPreferences: {
    preload: path.join(__dirname, '../preload/gemini-bridge.js'),
    contextIsolation: true,
    nodeIntegration: false,
    partition: 'persist:gemini',
  },
});

mainWindow.setBrowserView(geminiView);
geminiView.setBounds({
  x: 0,
  y: process.platform === 'darwin' ? 28 : 32, // Title bar height
  width: mainWindow.getBounds().width,
  height: mainWindow.getBounds().height - (process.platform === 'darwin' ? 28 : 32),
});
geminiView.setAutoResize({ width: true, height: true });
geminiView.webContents.loadURL('https://gemini.google.com');
```

---

### 6.2 Global Keyboard Shortcut

**Description**: A system-wide hotkey to instantly summon or dismiss the Gemini window from any context.

**Requirements**:

- **F-KEY-01**: Default global shortcut: `Alt + Space` (configurable). On macOS, also support `Option + Space`.
- **F-KEY-02**: Shortcut behavior:
  - If app is hidden → show and focus
  - If app is visible but not focused → focus
  - If app is focused → hide (toggle behavior)
- **F-KEY-03**: Settings UI to customize the shortcut. Validate for conflicts with OS shortcuts.
- **F-KEY-04**: Show a one-time onboarding tooltip explaining the global shortcut after first launch.
- **F-KEY-05**: Secondary shortcut `Cmd/Ctrl + Shift + G` to open a new conversation directly.

**Implementation Notes**:

```typescript
// shortcut-manager.ts
import { globalShortcut, BrowserWindow } from 'electron';

export function registerGlobalShortcuts(
  window: BrowserWindow,
  settings: SettingsStore
) {
  const shortcut = settings.get('globalShortcut', 'Alt+Space');

  globalShortcut.register(shortcut, () => {
    if (window.isVisible() && window.isFocused()) {
      window.hide();
    } else {
      window.show();
      window.focus();
    }
  });
}
```

---

### 6.3 System Tray / Menu Bar

**Description**: Persistent tray icon for quick access and status indication.

**Requirements**:

- **F-TRAY-01**: Show a tray icon on all platforms. On macOS, use a monochrome template image for the menu bar (22x22px, `Template` suffix in filename). On Windows/Linux, use a colored icon (16x16 or 32x32).
- **F-TRAY-02**: Tray context menu items:
  - "Open Gemini" — show/focus main window
  - "New Conversation" — open new window with fresh session
  - Separator
  - "Start at Login" — toggle (checkbox)
  - "Settings..." — open settings panel
  - Separator
  - "Check for Updates"
  - "About Gemini Desktop"
  - Separator
  - "Quit Gemini Desktop"
- **F-TRAY-03**: Single-click on tray icon shows/hides the main window (Windows/Linux). On macOS, single-click shows the menu (standard macOS behavior).
- **F-TRAY-04**: When the user closes the window (clicks X), minimize to tray instead of quitting (configurable). On macOS, hide the app. Show a one-time notification: "Gemini Desktop is still running in the background."
- **F-TRAY-05**: Tray icon tooltip shows "Gemini Desktop".

---

### 6.4 Native Application Menu

**Description**: Platform-appropriate menu bar with keyboard shortcuts.

**Requirements**:

- **F-MENU-01**: macOS app menu structure:
  ```
  Gemini Desktop
    About Gemini Desktop
    Check for Updates...
    ---
    Settings...          (Cmd+,)
    ---
    Hide Gemini Desktop  (Cmd+H)
    Hide Others          (Cmd+Option+H)
    Show All
    ---
    Quit                 (Cmd+Q)

  File
    New Window           (Cmd+N)
    New Conversation     (Cmd+Shift+N)
    ---
    Close Window         (Cmd+W)

  Edit
    Undo                 (Cmd+Z)
    Redo                 (Cmd+Shift+Z)
    ---
    Cut                  (Cmd+X)
    Copy                 (Cmd+C)
    Paste                (Cmd+V)
    Select All           (Cmd+A)
    ---
    Find...              (Cmd+F)

  View
    Reload               (Cmd+R)
    Force Reload         (Cmd+Shift+R)
    ---
    Actual Size          (Cmd+0)
    Zoom In              (Cmd+=)
    Zoom Out             (Cmd+-)
    ---
    Toggle Full Screen   (Cmd+Ctrl+F)
    ---
    Toggle Developer Tools (Cmd+Option+I)

  Window
    Minimize             (Cmd+M)
    Zoom
    ---
    Bring All to Front

  Help
    Gemini Help
    ---
    Report an Issue...
  ```

- **F-MENU-02**: Windows/Linux menu follows a similar structure with `Ctrl` instead of `Cmd`. Omit the app-name menu (handled by the first menu).
- **F-MENU-03**: "New Conversation" triggers navigation to `https://gemini.google.com/app` (new chat URL) in the current BrowserView.

---

### 6.5 Theme & Appearance

**Description**: Respect OS appearance settings and optionally override.

**Requirements**:

- **F-THEME-01**: Three theme modes: "System" (default), "Light", "Dark". Stored in settings.
- **F-THEME-02**: When "System" is selected, listen to `nativeTheme.on('updated')` and react in real-time.
- **F-THEME-03**: Inject a CSS override into the BrowserView to force Gemini's theme to match the app's setting. Gemini uses `prefers-color-scheme` media query — override via `webContents.insertCSS()` or by setting the `color-scheme` meta tag.
- **F-THEME-04**: The custom title bar (Windows/Linux) and settings panel must also respect the current theme.
- **F-THEME-05**: Window background color should match the theme to avoid white flash on launch.

**Implementation Notes**:

```typescript
// theme-manager.ts
import { nativeTheme, BrowserView } from 'electron';

export function applyTheme(
  view: BrowserView,
  mode: 'system' | 'light' | 'dark'
) {
  if (mode !== 'system') {
    nativeTheme.themeSource = mode;
  } else {
    nativeTheme.themeSource = 'system';
  }

  const isDark =
    mode === 'dark' || (mode === 'system' && nativeTheme.shouldUseDarkColors);

  // Force Gemini to respect our theme choice
  view.webContents.insertCSS(`
    :root {
      color-scheme: ${isDark ? 'dark' : 'light'} !important;
    }
  `);
}
```

---

### 6.6 Settings Panel

**Description**: A native-feeling settings overlay accessible via `Cmd/Ctrl + ,` or the tray menu.

**Requirements**:

- **F-SET-01**: Settings panel renders as a React overlay on top of the main window (not a separate window). Animated slide-in from the right or modal.
- **F-SET-02**: Settings categories and options:

  **General**
  - Start at login (toggle) — default: off
  - Close to tray instead of quitting (toggle) — default: on
  - Show in dock/taskbar (toggle, macOS only) — default: on
  - Launch in background (toggle) — default: off

  **Appearance**
  - Theme: System / Light / Dark (radio group)
  - Zoom level: 80% / 90% / 100% / 110% / 125% (dropdown)

  **Shortcuts**
  - Global summon shortcut (shortcut recorder input)
  - New conversation shortcut (shortcut recorder input)

  **Notifications**
  - Enable desktop notifications (toggle) — default: on
  - Notification sound (toggle) — default: off

  **Advanced**
  - Custom Gemini URL (text input) — default: `https://gemini.google.com`
  - Clear all browsing data (button with confirmation)
  - Reset all settings to defaults (button with confirmation)
  - About: App version, Electron version, Chromium version

- **F-SET-03**: All settings persist via `electron-store` in the user's app data directory.
- **F-SET-04**: Settings changes apply immediately (no save button needed). Use debouncing for text inputs.

---

### 6.7 Auto-Update

**Description**: Seamless background updates via GitHub Releases (or a custom update server).

**Requirements**:

- **F-UPD-01**: Use `electron-updater` with GitHub Releases as the update source.
- **F-UPD-02**: Check for updates on app launch (after 10-second delay) and every 4 hours while running.
- **F-UPD-03**: When an update is available, show a non-intrusive banner at the top of the window: "A new version is available. [Restart to Update] [Later]".
- **F-UPD-04**: Download updates in the background. Show download progress in the banner.
- **F-UPD-05**: "Restart to Update" quits and installs the update. "Later" dismisses the banner until the next check.
- **F-UPD-06**: On macOS, support DMG distribution with code signing and notarization.
- **F-UPD-07**: On Windows, support NSIS installer and auto-update via `electron-updater`.
- **F-UPD-08**: On Linux, support AppImage with auto-update and .deb/.rpm packages.

---

### 6.8 Deep Linking / Protocol Handler

**Description**: Register a custom protocol so external apps can trigger Gemini actions.

**Requirements**:

- **F-DEEP-01**: Register `gemini-desktop://` as a custom protocol handler.
- **F-DEEP-02**: Supported URL patterns:
  - `gemini-desktop://open` — open/focus the app
  - `gemini-desktop://new` — open a new conversation
  - `gemini-desktop://prompt?text=<encoded_text>` — open a new conversation and pre-fill the prompt (do NOT auto-send; let the user review)
- **F-DEEP-03**: Handle the protocol on macOS via `app.on('open-url')`, on Windows/Linux via `app.on('second-instance')`.
- **F-DEEP-04**: If the app is not running, launch it and then handle the deep link.

---

### 6.9 Notifications

**Description**: Native OS notifications when Gemini completes a response (optional, for long-running queries).

**Requirements**:

- **F-NOTIF-01**: When the app window is NOT focused and Gemini's page title changes (indicating a new response), show a native `Notification` with the conversation title.
- **F-NOTIF-02**: Clicking the notification focuses the app window and brings it to the foreground.
- **F-NOTIF-03**: Notifications are opt-in via settings (default: on).
- **F-NOTIF-04**: Rate-limit notifications to max 1 per 5 seconds to prevent spamming during streaming responses.
- **F-NOTIF-05**: On macOS, respect system "Do Not Disturb" / Focus mode automatically (handled by macOS APIs).

**Implementation Notes**:

```typescript
// notification-manager.ts
// Observe title changes in the BrowserView to detect responses
geminiView.webContents.on('page-title-updated', (_event, title) => {
  if (!mainWindow.isFocused() && settings.get('notifications.enabled', true)) {
    const now = Date.now();
    if (now - lastNotificationTime > 5000) {
      new Notification({
        title: 'Gemini Desktop',
        body: `New response: ${title}`,
        icon: path.join(__dirname, '../../assets/icons/icon.png'),
      }).show();
      lastNotificationTime = now;
    }
  }
});
```

---

### 6.10 Connectivity Handling

**Description**: Graceful UX when the user goes offline.

**Requirements**:

- **F-CONN-01**: Detect connectivity changes using Electron's `net` module or by injecting a network observer in the preload script.
- **F-CONN-02**: When offline, show a top banner: "You're offline. Gemini requires an internet connection." with a "Retry" button. The banner should be styled to match Gemini's design language.
- **F-CONN-03**: Automatically dismiss the banner and reload when connectivity is restored.
- **F-CONN-04**: Do not show the Chromium default offline error page. Intercept it and show the custom offline UI.

---

### 6.11 Google Account & Authentication

**Description**: Handle Google sign-in within the wrapper.

**Requirements**:

- **F-AUTH-01**: Allow Google OAuth sign-in flows to work seamlessly within the BrowserView. Handle popup windows for OAuth by creating a new `BrowserWindow` for the auth flow and closing it upon completion.
- **F-AUTH-02**: Persist session cookies using Electron's `partition: 'persist:gemini'` so the user stays logged in across restarts.
- **F-AUTH-03**: Support multiple Google accounts (Gemini's built-in account switcher should work natively).
- **F-AUTH-04**: Provide a "Sign Out" option in the tray menu that clears the session and reloads.

---

### 6.12 Performance & Security

**Requirements**:

- **F-PERF-01**: App cold start to Gemini loaded in under 3 seconds on a modern machine.
- **F-PERF-02**: Memory footprint under 350MB at idle (Electron + Gemini page).
- **F-PERF-03**: Electron security best practices:
  - `contextIsolation: true`
  - `nodeIntegration: false`
  - `sandbox: true`
  - Strict CSP headers
  - No `remote` module usage
  - Validate all IPC messages
- **F-PERF-04**: Preload scripts use `contextBridge.exposeInMainWorld()` to expose only the minimum required API surface.
- **F-PERF-05**: All IPC channels are explicitly listed in `channels.ts` — no dynamic channel creation.

---

## 7. IPC Channel Specification

Define all communication channels between main and renderer processes.

```typescript
// src/shared/channels.ts
export const IPC_CHANNELS = {
  // Window management
  WINDOW_MINIMIZE: 'window:minimize',
  WINDOW_MAXIMIZE: 'window:maximize',
  WINDOW_CLOSE: 'window:close',
  WINDOW_IS_MAXIMIZED: 'window:is-maximized',

  // Theme
  THEME_GET: 'theme:get',
  THEME_SET: 'theme:set',
  THEME_CHANGED: 'theme:changed', // Main → Renderer

  // Settings
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',
  SETTINGS_RESET: 'settings:reset',

  // App lifecycle
  APP_VERSION: 'app:version',
  APP_CLEAR_DATA: 'app:clear-data',

  // Updates
  UPDATE_AVAILABLE: 'update:available',       // Main → Renderer
  UPDATE_PROGRESS: 'update:progress',         // Main → Renderer
  UPDATE_DOWNLOADED: 'update:downloaded',      // Main → Renderer
  UPDATE_INSTALL: 'update:install',            // Renderer → Main
  UPDATE_CHECK: 'update:check',               // Renderer → Main

  // Connectivity
  CONNECTIVITY_CHANGED: 'connectivity:changed', // Main → Renderer

  // Navigation
  NAV_NEW_CONVERSATION: 'nav:new-conversation',
  NAV_GO_BACK: 'nav:go-back',
  NAV_GO_FORWARD: 'nav:go-forward',
  NAV_RELOAD: 'nav:reload',
} as const;
```

---

## 8. Settings Store Schema

```typescript
// src/shared/types.ts
export interface AppSettings {
  // General
  startAtLogin: boolean;          // default: false
  closeToTray: boolean;           // default: true
  showInDock: boolean;            // default: true (macOS only)
  launchInBackground: boolean;    // default: false

  // Appearance
  theme: 'system' | 'light' | 'dark';  // default: 'system'
  zoomLevel: number;                     // default: 1.0

  // Shortcuts
  globalShortcut: string;         // default: 'Alt+Space'
  newConversationShortcut: string; // default: 'CmdOrCtrl+Shift+G'

  // Notifications
  notificationsEnabled: boolean;  // default: true
  notificationSound: boolean;     // default: false

  // Advanced
  geminiUrl: string;              // default: 'https://gemini.google.com'

  // Window state (internal, not shown in settings UI)
  windowBounds: {
    x: number;
    y: number;
    width: number;
    height: number;
    isMaximized: boolean;
  };

  // Onboarding
  hasSeenShortcutHint: boolean;   // default: false
  hasSeenTrayHint: boolean;       // default: false
}
```

---

## 9. Build & Distribution

### 9.1 electron-builder Configuration

```yaml
# electron-builder.yml
appId: com.gemini-desktop.app
productName: Gemini Desktop
copyright: Copyright © 2026

directories:
  output: dist
  buildResources: assets

files:
  - "out/**/*"
  - "assets/**/*"

mac:
  category: public.app-category.productivity
  icon: assets/icons/icon.icns
  hardenedRuntime: true
  gatekeeperAssess: false
  entitlements: build/entitlements.mac.plist
  entitlementsInherit: build/entitlements.mac.plist
  target:
    - target: dmg
      arch: [universal]
    - target: zip
      arch: [universal]

dmg:
  sign: false
  contents:
    - x: 130
      y: 220
    - x: 410
      y: 220
      type: link
      path: /Applications

win:
  icon: assets/icons/icon.ico
  target:
    - target: nsis
      arch: [x64]

nsis:
  oneClick: false
  perMachine: false
  allowToChangeInstallationDirectory: true
  deleteAppDataOnUninstall: false

linux:
  icon: assets/icons/icon.png
  category: Utility
  target:
    - target: AppImage
      arch: [x64]
    - target: deb
      arch: [x64]
    - target: rpm
      arch: [x64]

protocols:
  name: Gemini Desktop
  schemes:
    - gemini-desktop

publish:
  provider: github
  owner: YOUR_GITHUB_USERNAME
  repo: gemini-desktop
```

### 9.2 macOS Entitlements

```xml
<!-- build/entitlements.mac.plist -->
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>com.apple.security.cs.allow-jit</key>
  <true/>
  <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
  <true/>
  <key>com.apple.security.cs.allow-dyld-environment-variables</key>
  <true/>
  <key>com.apple.security.network.client</key>
  <true/>
  <key>com.apple.security.files.user-selected.read-write</key>
  <true/>
</dict>
</plist>
```

### 9.3 NPM Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "start": "electron .",
    "dev:electron": "concurrently \"vite\" \"wait-on http://localhost:5173 && electron .\"",
    "pack": "electron-builder --dir",
    "dist": "electron-builder",
    "dist:mac": "electron-builder --mac",
    "dist:win": "electron-builder --win",
    "dist:linux": "electron-builder --linux",
    "test": "vitest run",
    "test:e2e": "playwright test",
    "lint": "eslint src/",
    "typecheck": "tsc --noEmit"
  }
}
```

---

## 10. User Experience Flows

### 10.1 First Launch

1. App opens with a welcome splash (2 seconds) showing the Gemini Desktop logo.
2. Main window appears with Gemini loaded.
3. If not signed in, Google's sign-in page appears within the BrowserView.
4. After sign-in, a small toast notification appears: "Tip: Press Alt+Space to summon Gemini from anywhere."
5. The tray icon appears with a badge dot for the first time. Toast: "Gemini Desktop runs in your system tray."

### 10.2 Daily Usage

1. User presses `Alt+Space` → app window slides in or appears.
2. User types a prompt → Gemini responds.
3. User presses `Alt+Space` again → app hides.
4. If the user clicks the X button → app minimizes to tray (with notification on first occurrence).
5. If Gemini finishes a long response while the app is hidden → native notification appears.

### 10.3 Update Flow

1. App checks for updates in the background.
2. Banner appears at top: "Version X.Y.Z available — downloading..."
3. Progress bar fills as the update downloads.
4. Banner changes to: "Update ready. [Restart Now] [Later]"
5. User clicks "Restart Now" → app quits, installs update, relaunches.

---

## 11. Testing Strategy

### 11.1 Unit Tests (Vitest)

- `window-manager.ts`: Window creation, bounds persistence, multi-window
- `settings-store.ts`: Get/set/reset, defaults, validation
- `shortcut-manager.ts`: Registration, conflict detection
- `theme-manager.ts`: Theme application, system theme detection

### 11.2 E2E Tests (Playwright + Electron)

- App launches and shows Gemini within 5 seconds
- Global shortcut toggles window visibility
- Tray icon appears and context menu works
- Settings panel opens and persists changes
- External links open in default browser
- OAuth popup flow works (mock)
- Close-to-tray behavior works
- Deep link protocol opens the app

### 11.3 Manual Test Checklist

- [ ] macOS: Traffic lights position correctly
- [ ] macOS: App appears in menu bar
- [ ] macOS: Notarization passes
- [ ] Windows: NSIS installer works
- [ ] Windows: Custom title bar buttons work
- [ ] Linux: AppImage auto-update works
- [ ] All: Google sign-in completes
- [ ] All: Multiple windows work independently
- [ ] All: Zoom levels persist
- [ ] All: Offline banner shows and auto-dismisses

---

## 12. App Icon

Generate a clean, modern app icon for Gemini Desktop. The icon should:

- Use Gemini's signature 4-point star shape
- Gradient from blue (#4285F4) to purple (#A855F7) to pink (#EC4899)
- Clean white background variant for macOS dock
- Transparent background variant for tray/taskbar
- Sizes needed: 16x16, 32x32, 64x64, 128x128, 256x256, 512x512, 1024x1024
- `.icns` for macOS, `.ico` for Windows, `.png` for Linux

Use an icon generation tool or script. The icon can be a simple SVG scaled to all sizes:

```bash
# scripts/generate-icons.sh
# Requires: Inkscape or librsvg (rsvg-convert)
SIZES="16 32 64 128 256 512 1024"
for size in $SIZES; do
  rsvg-convert -w $size -h $size assets/icons/icon.svg > assets/icons/icon-${size}.png
done
# macOS .icns
png2icns assets/icons/icon.icns assets/icons/icon-{16,32,128,256,512}.png
# Windows .ico
convert assets/icons/icon-{16,32,64,128,256}.png assets/icons/icon.ico
```

---

## 13. Future Enhancements (v2+)

These are explicitly OUT OF SCOPE for v1 but documented for future planning:

1. **Quick Prompt Bar**: A floating, Spotlight-style input that appears on global shortcut, allowing the user to type a quick prompt without showing the full window. Response appears in a compact popup.
2. **Clipboard Integration**: Right-click system tray > "Ask Gemini about clipboard" sends clipboard content as a prompt.
3. **File Drag & Drop**: Drag files onto the app icon or window to attach them to a Gemini conversation.
4. **Custom CSS Injection**: Let power users inject custom CSS to customize Gemini's appearance.
5. **Conversation History Search**: Local search across cached conversation titles.
6. **Touch Bar Support (macOS)**: Quick action buttons on MacBook Pro Touch Bar.
7. **Voice Input**: Push-to-talk via global shortcut for voice prompts.
8. **Plugin System**: Allow community extensions (e.g., custom shortcuts, integrations).
9. **Gemini API Mode**: Option to use the Gemini API directly instead of the web UI, enabling features like custom system prompts and token management.

---

## 14. Success Metrics

| Metric | Target |
|--------|--------|
| Cold start time | < 3 seconds |
| Memory usage (idle) | < 350 MB |
| Crash rate | < 0.1% of sessions |
| Auto-update success rate | > 95% |
| Binary size (macOS universal) | < 250 MB |
| Binary size (Windows x64) | < 180 MB |

---

## 15. Claude Code Implementation Instructions

When building this project, follow this order:

### Phase 1: Scaffold (Priority: Highest)
1. Initialize the project with `npm init`, install all dependencies
2. Set up Vite + Electron + TypeScript + React configuration
3. Create the project structure as defined in Section 5.2
4. Get a basic Electron window loading `https://gemini.google.com` working

### Phase 2: Core Window Experience
5. Implement `window-manager.ts` with bounds persistence
6. Implement the custom title bar for Windows/Linux
7. Set up the `BrowserView` with proper navigation handling
8. Configure user-agent and session persistence
9. Handle OAuth popup windows for Google sign-in

### Phase 3: OS Integration
10. Implement `tray-manager.ts` with full context menu
11. Implement `shortcut-manager.ts` with global hotkey
12. Implement `menu.ts` with the full native menu
13. Implement `theme-manager.ts`
14. Implement close-to-tray behavior

### Phase 4: Settings & Polish
15. Build the Settings panel React UI
16. Implement `settings-store.ts` with the full schema
17. Wire all settings to their respective managers
18. Implement `notification-manager.ts`
19. Implement `connectivity` offline banner

### Phase 5: Distribution
20. Implement `auto-updater.ts`
21. Configure `electron-builder.yml`
22. Set up the build scripts
23. Implement deep link protocol handler
24. Generate app icons

### Phase 6: Testing & QA
25. Write unit tests for all managers
26. Write E2E tests with Playwright
27. Manual testing on all three platforms
28. Performance profiling and optimization

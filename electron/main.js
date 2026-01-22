const { app, BrowserWindow, ipcMain, nativeTheme, Notification, Menu } = require('electron');
const path = require('path');
const Store = require('electron-store');
const { autoUpdater } = require('electron-updater');
const { createTray, updateTrayIcon, destroyTray, isTaskbarDark } = require('./tray');

// Set AppUserModelId for Windows notifications (required for toast notifications)
if (process.platform === 'win32') {
  app.setAppUserModelId('com.mattermost.desktop-react');
}

// Initialize store
const store = new Store({
  defaults: {
    serverUrl: '',
    theme: 'system',
    notificationsEnabled: true,
    notificationSound: true,
    minimizeToTray: true
  }
});

let mainWindow = null;
let isQuitting = false;
let lastTaskbarDarkState = null;

function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Settings',
          accelerator: 'CmdOrCtrl+,',
          click: () => {
            mainWindow?.webContents.send('navigate-to-settings');
          }
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            isQuitting = true;
            app.quit();
          }
        }
      ]
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
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Back',
          accelerator: 'Alt+Left',
          click: () => {
            mainWindow?.webContents.send('webview-go-back');
          }
        },
        {
          label: 'Forward',
          accelerator: 'Alt+Right',
          click: () => {
            mainWindow?.webContents.send('webview-go-forward');
          }
        },
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            mainWindow?.webContents.send('webview-reload');
          }
        },
        { type: 'separator' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function getTaskbarIconPath() {
  return path.join(__dirname, '..', 'Icon', 'mattermost.ico');
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    icon: getTaskbarIconPath(),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true
    },
    show: false
  });

  // Load the app
  const startUrl = process.env.ELECTRON_START_URL ||
    `file://${path.join(__dirname, '..', 'build', 'index.html')}`;

  mainWindow.loadURL(startUrl);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    createTray(mainWindow, store);
    updateTaskbarIcons();
  });

  // Handle minimize to tray
  mainWindow.on('close', (event) => {
    if (!isQuitting && store.get('minimizeToTray')) {
      event.preventDefault();
      mainWindow.hide();
      return false;
    }
    return true;
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Check for taskbar theme changes when window gains focus
  mainWindow.on('focus', () => {
    if (process.platform === 'win32') {
      checkTaskbarThemeChanged();
    }
  });

  // Open DevTools in development
  if (process.env.ELECTRON_START_URL) {
    mainWindow.webContents.openDevTools();
  }
}

function updateTaskbarIcons() {
  // Both tray and window icons follow Windows taskbar theme
  const isDark = isTaskbarDark();
  updateTrayIcon(isDark);

  // Update window/taskbar icon
  if (mainWindow) {
    mainWindow.setIcon(getTaskbarIconPath());
  }

  lastTaskbarDarkState = isDark;
}

function checkTaskbarThemeChanged() {
  // Only update if theme actually changed
  const currentState = isTaskbarDark();
  if (currentState !== lastTaskbarDarkState) {
    updateTaskbarIcons();
  }
}

// IPC Handlers
ipcMain.handle('get-settings', () => {
  return {
    serverUrl: store.get('serverUrl'),
    theme: store.get('theme'),
    notificationsEnabled: store.get('notificationsEnabled'),
    notificationSound: store.get('notificationSound'),
    minimizeToTray: store.get('minimizeToTray')
  };
});

ipcMain.handle('set-setting', (event, key, value) => {
  store.set(key, value);

  if (key === 'theme') {
    updateTaskbarIcons();
    mainWindow?.webContents.send('theme-changed', value);
  }

  return true;
});

ipcMain.handle('clear-data', () => {
  store.clear();
  store.set('serverUrl', '');
  store.set('theme', 'system');
  store.set('notificationsEnabled', true);
  store.set('notificationSound', true);
  store.set('minimizeToTray', true);
  return true;
});

ipcMain.handle('show-notification', (event, title, body) => {
  if (!store.get('notificationsEnabled')) return;

  const notification = new Notification({
    title: title,
    body: body,
    icon: path.join(__dirname, '..', 'Icon', 'Mattermost_icon_denim@2x.png')
  });

  notification.on('click', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  notification.show();
});

ipcMain.handle('set-badge', (event, count) => {
  if (mainWindow) {
    if (count > 0) {
      mainWindow.setTitle(`Mattermost (${count})`);
    } else {
      mainWindow.setTitle('Mattermost');
    }
  }
});

ipcMain.handle('get-system-theme', () => {
  return nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
});

// Listen for system theme changes
nativeTheme.on('updated', () => {
  if (store.get('theme') === 'system') {
    updateTaskbarIcons();
    mainWindow?.webContents.send('system-theme-changed', nativeTheme.shouldUseDarkColors ? 'dark' : 'light');
  }
});

// Auto-updater setup
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

autoUpdater.on('update-available', (info) => {
  mainWindow?.webContents.send('update-available', info);
});

autoUpdater.on('update-downloaded', (info) => {
  mainWindow?.webContents.send('update-downloaded', info);
});

autoUpdater.on('error', (error) => {
  console.error('Auto-updater error:', error);
  // Send a clean, user-friendly error message
  let message = 'Could not check for updates';
  if (error.message?.includes('Unable to find latest version')) {
    message = 'No releases found. Make sure a published release exists on GitHub.';
  } else if (error.message?.includes('net::')) {
    message = 'Network error. Please check your internet connection.';
  }
  mainWindow?.webContents.send('update-error', message);
});

autoUpdater.on('update-not-available', (info) => {
  mainWindow?.webContents.send('update-not-available', info);
});

ipcMain.handle('check-for-updates', async () => {
  try {
    const result = await autoUpdater.checkForUpdates();
    return result;
  } catch (error) {
    console.error('Update check failed:', error);
    return null;
  }
});

ipcMain.handle('download-update', () => {
  autoUpdater.downloadUpdate();
});

ipcMain.handle('install-update', () => {
  isQuitting = true;
  autoUpdater.quitAndInstall();
});

// App lifecycle
app.whenReady().then(() => {
  createMenu();
  createWindow();

  // Check for updates on startup (after a short delay)
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch(err => {
      console.log('Update check skipped:', err.message);
    });
  }, 3000);
});

app.on('before-quit', () => {
  isQuitting = true;
  destroyTray();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  } else if (mainWindow) {
    mainWindow.show();
  }
});

// Export for tray module
module.exports = { store };

const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Settings
  getSettings: () => ipcRenderer.invoke('get-settings'),
  setSetting: (key, value) => ipcRenderer.invoke('set-setting', key, value),
  clearData: () => ipcRenderer.invoke('clear-data'),

  // Theme
  getSystemTheme: () => ipcRenderer.invoke('get-system-theme'),
  onThemeChanged: (callback) => {
    ipcRenderer.on('theme-changed', (event, theme) => callback(theme));
  },
  onSystemThemeChanged: (callback) => {
    ipcRenderer.on('system-theme-changed', (event, theme) => callback(theme));
  },

  // Notifications
  showNotification: (title, body) => ipcRenderer.invoke('show-notification', title, body),

  // Badge
  setBadge: (count) => ipcRenderer.invoke('set-badge', count),

  // Updates
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  downloadUpdate: () => ipcRenderer.invoke('download-update'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  onUpdateAvailable: (callback) => {
    ipcRenderer.on('update-available', (event, info) => callback(info));
  },
  onUpdateDownloaded: (callback) => {
    ipcRenderer.on('update-downloaded', (event, info) => callback(info));
  },

  // Remove listeners (for cleanup)
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  },

  // Navigation (from menu)
  onNavigateToSettings: (callback) => {
    ipcRenderer.on('navigate-to-settings', () => callback());
  },
  onWebviewGoBack: (callback) => {
    ipcRenderer.on('webview-go-back', () => callback());
  },
  onWebviewGoForward: (callback) => {
    ipcRenderer.on('webview-go-forward', () => callback());
  },
  onWebviewReload: (callback) => {
    ipcRenderer.on('webview-reload', () => callback());
  }
});

// Inject notification interceptor script for webview
contextBridge.exposeInMainWorld('notificationBridge', {
  getInjectionScript: () => {
    return `
      (function() {
        const OriginalNotification = window.Notification;

        window.Notification = function(title, options) {
          window.postMessage({
            type: 'mattermost-notification',
            title: title,
            body: options?.body || ''
          }, '*');

          return new OriginalNotification(title, options);
        };

        window.Notification.permission = OriginalNotification.permission;
        window.Notification.requestPermission = OriginalNotification.requestPermission.bind(OriginalNotification);

        // Handle unread count from title
        const observer = new MutationObserver(() => {
          const title = document.title;
          const match = title.match(/\\((\\d+)\\)/);
          const count = match ? parseInt(match[1], 10) : 0;
          window.postMessage({
            type: 'mattermost-unread-count',
            count: count
          }, '*');
        });

        observer.observe(document.querySelector('title') || document.head, {
          subtree: true,
          characterData: true,
          childList: true
        });
      })();
    `;
  }
});

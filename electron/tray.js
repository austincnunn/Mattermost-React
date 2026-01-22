const { Tray, Menu, app, nativeImage } = require('electron');
const path = require('path');
const { execSync } = require('child_process');

let tray = null;
let mainWindow = null;
let store = null;

// Check Windows taskbar theme (not app theme) via registry
function isTaskbarDark() {
  if (process.platform !== 'win32') {
    return false;
  }

  try {
    // SystemUsesLightTheme: 0 = dark taskbar, 1 = light taskbar
    const result = execSync(
      'reg query "HKEY_CURRENT_USER\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize" /v SystemUsesLightTheme',
      { encoding: 'utf8' }
    );
    // If SystemUsesLightTheme is 0, taskbar is dark
    return result.includes('0x0');
  } catch (error) {
    // Fallback: assume light taskbar
    return false;
  }
}

function getIconPath(isDark) {
  return path.join(__dirname, '..', 'Icon', 'mattermost.ico');
}

function createTray(window, settingsStore) {
  mainWindow = window;
  store = settingsStore;

  const iconPath = getIconPath(isTaskbarDark());
  const icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });

  tray = new Tray(icon);
  tray.setToolTip('Mattermost');

  updateContextMenu();

  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });

  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  return tray;
}

function updateContextMenu() {
  if (!tray) return;

  const contextMenu = Menu.buildFromTemplate([
    {
      label: mainWindow?.isVisible() ? 'Hide' : 'Show',
      click: () => {
        if (mainWindow) {
          if (mainWindow.isVisible()) {
            mainWindow.hide();
          } else {
            mainWindow.show();
            mainWindow.focus();
          }
        }
        updateContextMenu();
      }
    },
    { type: 'separator' },
    {
      label: 'Settings',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
          mainWindow.webContents.send('navigate-to-settings');
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);
}

function updateTrayIcon(isDark) {
  if (!tray) return;

  const iconPath = getIconPath(isDark);
  const icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
  tray.setImage(icon);
}

function destroyTray() {
  if (tray) {
    tray.destroy();
    tray = null;
  }
}

module.exports = {
  createTray,
  updateTrayIcon,
  updateContextMenu,
  destroyTray,
  isTaskbarDark
};

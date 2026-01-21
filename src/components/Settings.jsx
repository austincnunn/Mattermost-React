import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useSettings } from '../hooks/useSettings';

function Settings({ onClose, onChangeServer, onClearData, updateInfo }) {
  const { theme, setTheme } = useTheme();
  const { settings, updateSetting } = useSettings();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [checkingUpdate, setCheckingUpdate] = useState(false);

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    updateSetting('theme', newTheme);
  };

  const handleNotificationsChange = (enabled) => {
    updateSetting('notificationsEnabled', enabled);
  };

  const handleNotificationSoundChange = (enabled) => {
    updateSetting('notificationSound', enabled);
  };

  const handleMinimizeToTrayChange = (enabled) => {
    updateSetting('minimizeToTray', enabled);
  };

  const handleClearData = () => {
    setShowClearConfirm(false);
    onClearData();
  };

  const handleCheckUpdate = async () => {
    if (window.electronAPI) {
      setCheckingUpdate(true);
      await window.electronAPI.checkForUpdates();
      setCheckingUpdate(false);
    }
  };

  const handleDownloadUpdate = () => {
    if (window.electronAPI) {
      window.electronAPI.downloadUpdate();
    }
  };

  const handleInstallUpdate = () => {
    if (window.electronAPI) {
      window.electronAPI.installUpdate();
    }
  };

  return (
    <div className="settings">
      <div className="settings-header">
        <button onClick={onClose} className="settings-back-btn">
          &#8592; Back
        </button>
        <h1>Settings</h1>
      </div>

      <div className="settings-content">
        {/* Appearance Section */}
        <section className="settings-section">
          <h2>Appearance</h2>

          <div className="setting-item">
            <label>Theme</label>
            <div className="setting-control">
              <select
                value={theme}
                onChange={(e) => handleThemeChange(e.target.value)}
              >
                <option value="system">System</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
          </div>

          <p className="setting-note">
            <strong>Note:</strong> This is for the native window UI only. You will need to change the Mattermost chat theme separately. To do so, go to your profile icon in
            Mattermost → Settings → Display → Theme.
          </p>
        </section>

        {/* Notifications Section */}
        <section className="settings-section">
          <h2>Notifications</h2>

          <div className="setting-item">
            <label>Enable notifications</label>
            <div className="setting-control">
              <input
                type="checkbox"
                checked={settings.notificationsEnabled}
                onChange={(e) => handleNotificationsChange(e.target.checked)}
              />
            </div>
          </div>

          <div className="setting-item">
            <label>Notification sound</label>
            <div className="setting-control">
              <input
                type="checkbox"
                checked={settings.notificationSound}
                onChange={(e) => handleNotificationSoundChange(e.target.checked)}
                disabled={!settings.notificationsEnabled}
              />
            </div>
          </div>
        </section>

        {/* Behavior Section */}
        <section className="settings-section">
          <h2>Behavior</h2>

          <div className="setting-item">
            <label>Minimize to system tray</label>
            <div className="setting-control">
              <input
                type="checkbox"
                checked={settings.minimizeToTray}
                onChange={(e) => handleMinimizeToTrayChange(e.target.checked)}
              />
            </div>
          </div>
        </section>

        {/* Server Section */}
        <section className="settings-section">
          <h2>Server</h2>

          <div className="setting-item">
            <label>Current server</label>
            <div className="setting-value">{settings.serverUrl || 'Not configured'}</div>
          </div>

          <div className="setting-item">
            <button onClick={onChangeServer} className="setting-btn">
              Change Server
            </button>
          </div>

          <div className="setting-item">
            <button
              onClick={() => setShowClearConfirm(true)}
              className="setting-btn danger"
            >
              Clear All Data
            </button>
          </div>
        </section>

        {/* Updates Section */}
        <section className="settings-section">
          <h2>Updates</h2>

          {updateInfo?.status === 'available' && (
            <div className="update-notice">
              <p>Update available: v{updateInfo.version}</p>
              <button onClick={handleDownloadUpdate} className="setting-btn">
                Download Update
              </button>
            </div>
          )}

          {updateInfo?.status === 'downloaded' && (
            <div className="update-notice">
              <p>Update ready to install: v{updateInfo.version}</p>
              <button onClick={handleInstallUpdate} className="setting-btn">
                Restart & Install
              </button>
            </div>
          )}

          {!updateInfo && (
            <div className="setting-item">
              <button
                onClick={handleCheckUpdate}
                className="setting-btn"
                disabled={checkingUpdate}
              >
                {checkingUpdate ? 'Checking...' : 'Check for Updates'}
              </button>
            </div>
          )}
        </section>

        {/* About Section */}
        <section className="settings-section">
          <h2>About</h2>
          <div className="setting-item">
            <label>Version</label>
            <div className="setting-value">1.0.0</div>
          </div>
        </section>
      </div>

      {/* Clear Data Confirmation Modal */}
      {showClearConfirm && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Clear All Data?</h3>
            <p>
              This will remove all saved settings, including your server URL.
              You will need to set up the server again.
            </p>
            <div className="modal-actions">
              <button onClick={() => setShowClearConfirm(false)}>Cancel</button>
              <button onClick={handleClearData} className="danger">
                Clear Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Settings;

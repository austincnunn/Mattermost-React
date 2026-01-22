import React, { useState, useEffect } from 'react';
import { useTheme } from './contexts/ThemeContext';
import { useSettings } from './hooks/useSettings';
import ServerSetup from './components/ServerSetup';
import MattermostView from './components/MattermostView';
import Settings from './components/Settings';
import './styles/light.css';
import './styles/dark.css';

function App() {
  const { theme, effectiveTheme } = useTheme();
  const { settings, loading, updateSetting } = useSettings();
  const [currentView, setCurrentView] = useState('loading');
  const [updateInfo, setUpdateInfo] = useState(null);

  useEffect(() => {
    if (!loading) {
      if (settings.serverUrl) {
        setCurrentView('mattermost');
      } else {
        setCurrentView('setup');
      }
    }
  }, [loading, settings.serverUrl]);

  // Listen for navigation from tray
  useEffect(() => {
    if (window.electronAPI) {
      const handleNavigate = () => setCurrentView('settings');
      window.electronAPI.onThemeChanged && window.electronAPI.onThemeChanged(() => {});

      // Listen for update notifications
      window.electronAPI.onUpdateAvailable && window.electronAPI.onUpdateAvailable((info) => {
        setUpdateInfo({ status: 'available', ...info });
      });

      window.electronAPI.onUpdateDownloaded && window.electronAPI.onUpdateDownloaded((info) => {
        setUpdateInfo({ status: 'downloaded', ...info });
      });

      window.electronAPI.onUpdateNotAvailable && window.electronAPI.onUpdateNotAvailable(() => {
        setUpdateInfo({ status: 'up-to-date' });
      });

      window.electronAPI.onUpdateError && window.electronAPI.onUpdateError((message) => {
        setUpdateInfo({ status: 'error', message });
      });
    }
  }, []);

  const handleServerSet = (url) => {
    updateSetting('serverUrl', url);
    setCurrentView('mattermost');
  };

  const handleOpenSettings = () => {
    setCurrentView('settings');
  };

  const handleCloseSettings = () => {
    if (settings.serverUrl) {
      setCurrentView('mattermost');
    } else {
      setCurrentView('setup');
    }
  };

  const handleChangeServer = () => {
    setCurrentView('setup');
  };

  const handleClearData = async () => {
    if (window.electronAPI) {
      await window.electronAPI.clearData();
    }
    setCurrentView('setup');
  };

  if (currentView === 'loading' || loading) {
    return (
      <div className={`app ${effectiveTheme}`}>
        <div className="loading-screen">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`app ${effectiveTheme}`}>
      {updateInfo && updateInfo.status === 'downloaded' && (
        <div className="update-banner">
          <span>Update ready to install (v{updateInfo.version})</span>
          <button onClick={() => window.electronAPI?.installUpdate()}>
            Restart & Update
          </button>
          <button onClick={() => setUpdateInfo(null)}>Later</button>
        </div>
      )}

      {currentView === 'setup' && (
        <ServerSetup
          onServerSet={handleServerSet}
          initialUrl={settings.serverUrl}
        />
      )}

      {currentView === 'mattermost' && (
        <MattermostView
          serverUrl={settings.serverUrl}
          onOpenSettings={handleOpenSettings}
        />
      )}

      {currentView === 'settings' && (
        <Settings
          onClose={handleCloseSettings}
          onChangeServer={handleChangeServer}
          onClearData={handleClearData}
          updateInfo={updateInfo}
        />
      )}
    </div>
  );
}

export default App;

import { useState, useEffect } from 'react';

const defaultSettings = {
  serverUrl: '',
  theme: 'system',
  notificationsEnabled: true,
  notificationSound: true,
  minimizeToTray: true
};

export function useSettings() {
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      if (window.electronAPI) {
        try {
          const loaded = await window.electronAPI.getSettings();
          setSettings({ ...defaultSettings, ...loaded });
        } catch (error) {
          console.error('Failed to load settings:', error);
        }
      }
      setLoading(false);
    };

    loadSettings();
  }, []);

  const updateSetting = async (key, value) => {
    // Optimistically update local state
    setSettings((prev) => ({ ...prev, [key]: value }));

    // Persist to electron-store
    if (window.electronAPI) {
      try {
        await window.electronAPI.setSetting(key, value);
      } catch (error) {
        console.error('Failed to save setting:', error);
        // Revert on error
        const loaded = await window.electronAPI.getSettings();
        setSettings({ ...defaultSettings, ...loaded });
      }
    }
  };

  const clearSettings = async () => {
    if (window.electronAPI) {
      try {
        await window.electronAPI.clearData();
        setSettings(defaultSettings);
      } catch (error) {
        console.error('Failed to clear settings:', error);
      }
    }
  };

  return {
    settings,
    loading,
    updateSetting,
    clearSettings
  };
}

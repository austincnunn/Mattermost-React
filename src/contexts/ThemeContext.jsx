import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('system');
  const [systemTheme, setSystemTheme] = useState('light');
  const [effectiveTheme, setEffectiveTheme] = useState('light');

  // Load initial theme from settings
  useEffect(() => {
    const loadTheme = async () => {
      if (window.electronAPI) {
        const settings = await window.electronAPI.getSettings();
        setTheme(settings.theme || 'system');

        const sysTheme = await window.electronAPI.getSystemTheme();
        setSystemTheme(sysTheme);
      } else {
        // Fallback for browser testing
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setSystemTheme(prefersDark ? 'dark' : 'light');
      }
    };

    loadTheme();
  }, []);

  // Update effective theme when theme or system theme changes
  useEffect(() => {
    if (theme === 'system') {
      setEffectiveTheme(systemTheme);
    } else {
      setEffectiveTheme(theme);
    }
  }, [theme, systemTheme]);

  // Listen for system theme changes
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.onSystemThemeChanged((newTheme) => {
        setSystemTheme(newTheme);
      });
    } else {
      // Fallback for browser testing
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e) => {
        setSystemTheme(e.matches ? 'dark' : 'light');
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  // Listen for theme changes from main process
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.onThemeChanged((newTheme) => {
        setTheme(newTheme);
      });
    }
  }, []);

  const value = {
    theme,
    setTheme,
    systemTheme,
    effectiveTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

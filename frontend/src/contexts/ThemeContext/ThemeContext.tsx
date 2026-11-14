import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { storageService } from '@/services/storage/storageService';

export type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const THEME_STORAGE_KEY = 'cloudsec_theme';

const getInitialTheme = (): Theme => {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    if (!raw) return 'dark';
    try {
      const parsed = JSON.parse(raw);
      if (parsed === 'light' || parsed === 'dark') return parsed;
    } catch {
      if (raw === 'light' || raw === 'dark') return raw;
    }
  } catch {
    // fallback
  }
  return 'dark';
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    root.style.colorScheme = theme;
    storageService.set(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
export default ThemeProvider;

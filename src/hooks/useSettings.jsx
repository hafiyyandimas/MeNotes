import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const KEY = 'iera.settings.v1';
const defaults = { theme: 'ocean', navPosition: 'bottom' };
const allowedThemes = ['ocean', 'slate', 'indigo'];
const allowedPositions = ['bottom', 'left', 'right'];
const SettingsContext = createContext(null);

function readSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    return {
      theme: allowedThemes.includes(saved.theme) ? saved.theme : defaults.theme,
      navPosition: allowedPositions.includes(saved.navPosition) ? saved.navPosition : defaults.navPosition,
    };
  } catch {
    return defaults;
  }
}

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(readSettings);

  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme;
    localStorage.setItem(KEY, JSON.stringify(settings));
  }, [settings]);

  const value = useMemo(() => ({
    ...settings,
    setTheme: (theme) => setSettings((current) => ({ ...current, theme })),
    setNavPosition: (navPosition) => setSettings((current) => ({ ...current, navPosition })),
  }), [settings]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within SettingsProvider.');
  return context;
}

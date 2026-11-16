import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { BookOpen, Cloud, CloudOff, Plus } from 'lucide-react';
import { useSettings } from '../hooks/useSettings';
import Navigation from './Navigation';
import { useEffect, useState } from 'react';

export default function AppShell() {
  const { navPosition } = useSettings();
  const location = useLocation();
  const [online, setOnline] = useState(navigator.onLine);
  const [applyUpdate, setApplyUpdate] = useState(null);
  const isNotes = location.pathname === '/';

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    const captureInstall = (event) => {
      event.preventDefault();
      window.ieraInstallPrompt = event;
      window.dispatchEvent(new CustomEvent('iera-install-prompt', { detail: event }));
    };
    const showUpdate = (event) => setApplyUpdate(() => event.detail);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    window.addEventListener('beforeinstallprompt', captureInstall);
    window.addEventListener('iera-update-available', showUpdate);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
      window.removeEventListener('beforeinstallprompt', captureInstall);
      window.removeEventListener('iera-update-available', showUpdate);
    };
  }, []);

  return (
    <div className={`app-shell nav-layout-${navPosition}`}>
      {navPosition !== 'bottom' && <Navigation position={navPosition} />}
      <div className="app-frame">
        <header className="topbar">
          <NavLink to="/" className="brand" aria-label="MeNotes home">
            <span className="brand-mark"><BookOpen size={19} /></span>
            <span>MeNotes</span>
          </NavLink>
          <div className="topbar-right">
            <span className={`connection-pill ${online ? 'is-online' : 'is-offline'}`}>
              {online ? <Cloud size={14} /> : <CloudOff size={14} />}
              {online ? 'Online' : 'Offline'}
            </span>
            {isNotes && (
              <NavLink className="button button-primary topbar-create" to="/notes/new">
                <Plus size={17} /> <span>New note</span>
              </NavLink>
            )}
          </div>
        </header>
        {applyUpdate && <div className="update-notice" role="status"><span>Update available</span><button type="button" className="text-button" onClick={() => applyUpdate(true)}>Reload</button></div>}
        <main className="main-content">
          <Outlet />
        </main>
      </div>
      {navPosition === 'bottom' && <Navigation position={navPosition} />}
    </div>
  );
}

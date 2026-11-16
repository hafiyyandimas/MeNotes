import { useEffect, useState } from 'react';
import { Check, CloudDownload, Download, MonitorDown, Smartphone, Wifi, WifiOff } from 'lucide-react';
import { useSettings } from '../hooks/useSettings';
import { useNotes } from '../hooks/useNotes';
import { database } from '../lib/database';

const themes = [
  { id: 'ocean', title: 'Ocean', detail: 'Deep navy · soft blue' },
  { id: 'slate', title: 'Slate', detail: 'Quiet charcoal · ice blue' },
  { id: 'indigo', title: 'Indigo', detail: 'Blue-violet · periwinkle' },
];
const positions = ['bottom', 'left', 'right'];

export default function SettingsPage() {
  const { theme, setTheme, navPosition, setNavPosition } = useSettings();
  const { notes, sync, syncing, setupMessage } = useNotes();
  const [online, setOnline] = useState(navigator.onLine);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [installState, setInstallState] = useState(
    window.matchMedia('(display-mode: standalone)').matches || navigator.standalone ? 'installed' : 'browser',
  );
  const [message, setMessage] = useState('');
  const [pendingCount, setPendingCount] = useState(0);
  const [installHelpOpen, setInstallHelpOpen] = useState(false);

  useEffect(() => {
    const updateOnline = () => setOnline(navigator.onLine);
    const setPrompt = (event) => setInstallPrompt(event.detail);
    const captureInstall = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    const installed = () => {
      setInstallPrompt(null);
      setInstallState('installed');
    };
    window.addEventListener('online', updateOnline);
    window.addEventListener('offline', updateOnline);
    window.addEventListener('beforeinstallprompt', captureInstall);
    window.addEventListener('iera-install-prompt', setPrompt);
    window.addEventListener('appinstalled', installed);
    if (window.ieraInstallPrompt) setInstallPrompt(window.ieraInstallPrompt);
    return () => {
      window.removeEventListener('online', updateOnline);
      window.removeEventListener('offline', updateOnline);
      window.removeEventListener('beforeinstallprompt', captureInstall);
      window.removeEventListener('iera-install-prompt', setPrompt);
      window.removeEventListener('appinstalled', installed);
    };
  }, []);

  useEffect(() => {
    database.mutations.count().then(setPendingCount);
  }, [notes, syncing]);

  async function installApp() {
    if (!installPrompt) {
      setInstallHelpOpen((open) => !open);
      return;
    }
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    setMessage(choice.outcome === 'accepted' ? 'MeNotes was added to your home screen.' : 'Install was dismissed.');
    setInstallPrompt(null);
  }

  async function handleSync() {
    setMessage('');
    const success = await sync();
    if (success) setMessage('Sync completed. Your saved notes are up to date.');
  }

  return (
    <section className="page settings-page">
      <div className="page-heading">
        <div><p className="eyebrow">MAKE IT FEEL LIKE YOURS</p><h1>Settings<span className="heading-period">.</span></h1><p className="page-subtitle">A few small choices for your workspace.</p></div>
      </div>

      <div className="settings-layout">
        <div className="settings-main">
          <section className="settings-section">
            <div className="settings-section-heading"><div><h2>Appearance</h2><p>Choose a calm shade for your space.</p></div></div>
            <div className="theme-options">
              {themes.map((item) => (
                <button key={item.id} type="button" className={`theme-option theme-${item.id}${theme === item.id ? ' selected' : ''}`} onClick={() => setTheme(item.id)} aria-pressed={theme === item.id}>
                  <span className="theme-preview"><i /><i /><i /></span>
                  <span className="theme-copy"><strong>{item.title}</strong><small>{item.detail}</small></span>
                  {theme === item.id && <Check size={17} className="theme-check" />}
                </button>
              ))}
            </div>
          </section>

          <section className="settings-section">
            <div className="settings-section-heading"><div><h2>Navigation</h2><p>Place your main menu where it feels natural.</p></div></div>
            <div className="position-options" role="group" aria-label="Navigation position">
              {positions.map((position) => (
                <button type="button" key={position} className={`position-option${navPosition === position ? ' selected' : ''}`} aria-pressed={navPosition === position} onClick={() => setNavPosition(position)}>
                  <span className={`position-preview preview-${position}`}><i /><i /><i /><b /></span>
                  <span>{position[0].toUpperCase() + position.slice(1)}</span>
                  {navPosition === position && <Check size={15} />}
                </button>
              ))}
            </div>
          </section>

          <section className="settings-section">
            <div className="settings-section-heading"><div><h2>App & sync</h2><p>Keep this device ready wherever you are.</p></div></div>
            <div className="status-card">
              <div className="status-icon">{online ? <Wifi size={18} /> : <WifiOff size={18} />}</div>
              <div className="status-copy"><strong>{online ? 'You’re online' : 'You’re offline'}</strong><span>{online ? 'Your device can reach the internet.' : 'Saved notes are still available on this device.'}</span></div>
              <span className={`status-dot ${online ? 'online' : ''}`} />
            </div>
            <div className="status-card">
              <div className="status-icon"><CloudDownload size={18} /></div>
              <div className="status-copy"><strong>{pendingCount ? `${pendingCount} change${pendingCount === 1 ? '' : 's'} waiting` : 'All caught up'}</strong><span>{setupMessage ? 'Cloud sync is not configured.' : 'Queued note changes sync when you are online.'}</span></div>
              <button type="button" className="button button-secondary sync-button" onClick={handleSync} disabled={syncing || Boolean(setupMessage)}><CloudDownload size={15} />{syncing ? 'Syncing…' : 'Sync now'}</button>
            </div>
            <div className="status-card install-status">
              <div className="status-icon">{installState === 'installed' ? <Smartphone size={18} /> : <MonitorDown size={18} />}</div>
              <div className="status-copy"><strong>{installState === 'installed' ? 'Installed on this device' : 'Install app'}</strong><span>{installState === 'installed' ? 'Open it from your home screen or app list.' : 'Add MeNotes to your home screen.'}</span></div>
              <button className="button button-primary sync-button" type="button" onClick={installApp} disabled={installState === 'installed'}>
                {installPrompt ? <Download size={15} /> : <MonitorDown size={15} />}
                {installState === 'installed' ? 'Installed' : 'Install'}
              </button>
            </div>
            {installState !== 'installed' && !installPrompt && installHelpOpen && (
              <div className="install-help"><strong>Install instructions</strong><p>iPhone/iPad: open in Safari, tap Share, then <em>Add to Home Screen</em>. Android: open the browser menu, then choose <em>Install app</em> or <em>Add to Home Screen</em>.</p></div>
            )}
            {setupMessage && <p className="settings-note">{setupMessage}</p>}
            {message && <p className="settings-feedback" role="status">{message}</p>}
          </section>
        </div>

      </div>
    </section>
  );
}

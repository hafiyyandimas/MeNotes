import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getSetupMessage, isSupabaseConfigured } from '../lib/supabase';
import { database } from '../lib/database';
import {
  deleteNote,
  fetchNotes,
  listLocalNotes,
  reorderNotes,
  saveNote,
  syncPending,
  updateNoteProperties,
} from '../services/notes';

const NotesContext = createContext(null);

export function NotesProvider({ children }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  const [sourceError, setSourceError] = useState('');

  const refresh = useCallback(async () => {
    const result = await fetchNotes();
    setNotes(result.notes);
    setSourceError(result.error?.message ?? '');
    setLoading(false);
  }, []);

  const sync = useCallback(async () => {
    setSyncing(true);
    setError('');
    try {
      await syncPending();
      await refresh();
      return true;
    } catch (err) {
      setError(err.message || 'Sync failed. Your local changes are safe and will remain queued.');
      return false;
    } finally {
      setSyncing(false);
    }
  }, [refresh]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const cached = await listLocalNotes();
      if (active) {
        setNotes(cached);
        setLoading(false);
      }
      const result = await fetchNotes();
      if (active) {
        setNotes(result.notes);
        setSourceError(result.error?.message ?? '');
        if (isSupabaseConfigured && navigator.onLine) await sync();
      }
    };
    load();
    const onOnline = () => {
      if (isSupabaseConfigured) sync();
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible' && isSupabaseConfigured && navigator.onLine) sync();
    };
    window.addEventListener('online', onOnline);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      active = false;
      window.removeEventListener('online', onOnline);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [sync]);

  const runLocal = useCallback(async (action) => {
    try {
      const value = await action();
      setNotes(await listLocalNotes());
      if (isSupabaseConfigured && navigator.onLine) {
        syncPending()
          .then(refresh)
          .catch((err) => setError(err.message || 'Saved on this device. Sync will retry later.'));
      }
      return value;
    } catch (err) {
      setError(err.message || 'Could not save your note.');
      throw err;
    }
  }, [refresh]);

  const value = useMemo(() => ({
    notes,
    loading,
    syncing,
    error,
    sourceError,
    setupMessage: isSupabaseConfigured ? '' : getSetupMessage(),
    clearError: () => setError(''),
    refresh,
    sync,
    save: (input, id) => runLocal(() => saveNote(input, id)),
    remove: (id) => runLocal(() => deleteNote(id)),
    update: (id, updates) => runLocal(() => updateNoteProperties(id, updates)),
    reorder: (ids) => runLocal(() => reorderNotes(ids)),
  }), [notes, loading, syncing, error, sourceError, refresh, sync, runLocal]);

  return <NotesContext.Provider value={value}>{children}</NotesContext.Provider>;
}

export function useNotes() {
  const context = useContext(NotesContext);
  if (!context) throw new Error('useNotes must be used within NotesProvider.');
  return context;
}

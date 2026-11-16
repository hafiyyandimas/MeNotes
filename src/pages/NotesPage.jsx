import { useEffect, useMemo, useRef, useState } from 'react';
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, rectSortingStrategy } from '@dnd-kit/sortable';
import { NavLink } from 'react-router-dom';
import { FilePlus2, Search, X } from 'lucide-react';
import NoteCard from '../components/NoteCard';
import { useNotes } from '../hooks/useNotes';

const filters = [
  { id: 'all', label: 'All notes' },
  { id: 'pinned', label: 'Pinned' },
  { id: 'archived', label: 'Archived' },
];

export default function NotesPage() {
  const { notes, loading, error, sourceError, clearError, update, reorder, sync, syncing } = useNotes();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const searchRef = useRef(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 7 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const visibleNotes = useMemo(() => {
    const search = query.trim().toLocaleLowerCase();
    return notes
      .filter((note) => filter === 'archived' ? note.is_archived : filter === 'pinned' ? note.is_pinned && !note.is_archived : !note.is_archived)
      .filter((note) => !search || [note.title, note.content, ...(note.tags ?? [])].some((value) => value?.toLocaleLowerCase().includes(search)))
      .sort((a, b) => Number(b.is_pinned) - Number(a.is_pinned) || (a.sort_order ?? 0) - (b.sort_order ?? 0) || b.updated_at.localeCompare(a.updated_at));
  }, [notes, filter, query]);

  useEffect(() => {
    const onShortcut = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onShortcut);
    return () => window.removeEventListener('keydown', onShortcut);
  }, []);

  async function togglePin(note) {
    try { await update(note.id, { is_pinned: !note.is_pinned }); } catch { /* surfaced by NotesProvider */ }
  }
  async function toggleArchive(note) {
    try { await update(note.id, { is_archived: !note.is_archived }); } catch { /* surfaced by NotesProvider */ }
  }

  function handleDragEnd({ active, over }) {
    if (!over || active.id === over.id || filter !== 'all') return;
    const reordered = arrayMove(visibleNotes, visibleNotes.findIndex((note) => note.id === active.id), visibleNotes.findIndex((note) => note.id === over.id));
    reorder(reordered.map((note) => note.id));
  }

  return (
    <section className="page notes-page">
      <div className="page-heading notes-heading">
        <div>
          <h1>Notes</h1>
        </div>
        <NavLink className="button button-primary desktop-create" to="/notes/new"><FilePlus2 size={17} /> New note</NavLink>
      </div>

      <div className="notes-toolbar">
        <label className="search-field">
          <Search size={18} aria-hidden="true" />
          <span className="sr-only">Search notes</span>
          <input ref={searchRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search notes" />
          {query && <button className="search-clear" type="button" aria-label="Clear search" onClick={() => setQuery('')}><X size={15} /></button>}
        </label>
        <div className="filter-list" role="tablist" aria-label="Filter notes">
          {filters.map(({ id, label }) => (
            <button key={id} type="button" role="tab" aria-selected={filter === id} className={`filter-button${filter === id ? ' selected' : ''}`} onClick={() => setFilter(id)}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="notice notice-error" role="alert"><span>{error}</span><button type="button" className="text-button" onClick={() => { clearError(); sync(); }}>Try again</button></div>}
      {!error && sourceError && <div className="notice notice-warning" role="status"><span>Could not refresh cloud notes. Showing this device's saved notes.</span><button type="button" className="text-button" onClick={sync}>{syncing ? 'Syncing…' : 'Retry'}</button></div>}

      {loading ? (
        <div className="notes-grid" aria-label="Loading notes">{[0, 1, 2].map((item) => <div key={item} className="note-skeleton" />)}</div>
      ) : visibleNotes.length ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={visibleNotes.map((note) => note.id)} strategy={rectSortingStrategy}>
            <div className="notes-grid">
              {visibleNotes.map((note) => <NoteCard key={note.id} note={note} onPin={togglePin} onArchive={toggleArchive} canSort={filter === 'all' && !query} />)}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="empty-state">
          <h2>{query ? 'No results' : filter === 'archived' ? 'Archive is empty' : filter === 'pinned' ? 'No pinned notes' : 'No notes yet'}</h2>
          {query ? <button className="button button-secondary" type="button" onClick={() => setQuery('')}>Clear search</button> : filter === 'all' && <NavLink className="button button-primary" to="/notes/new"><FilePlus2 size={16} /> New note</NavLink>}
        </div>
      )}
    </section>
  );
}

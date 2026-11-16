import { useEffect, useState } from 'react';
import { Archive, ArrowLeft, CalendarDays, Image as ImageIcon, Pencil, Pin, PinOff, Trash2 } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useNotes } from '../hooks/useNotes';
import { getNoteImage } from '../services/notes';

export default function NoteDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { notes, remove, update } = useNotes();
  const note = notes.find((item) => item.id === id);
  const [image, setImage] = useState('');

  useEffect(() => {
    let active = true;
    let url = '';
    async function loadImage() {
      try {
        url = await getNoteImage(note.id, note.image_paths?.[0], note.localImageId);
        if (active) setImage(url ?? '');
      } catch {
        if (active) setImage('');
      }
    }
    loadImage();
    return () => { active = false; if (url) URL.revokeObjectURL(url); };
  }, [note?.id, note?.localImageId, note?.image_paths?.[0]]);

  if (!note) {
    return <section className="page not-found"><Link className="back-link" to="/"><ArrowLeft size={16} /> Back to notes</Link><h1>Note not found</h1><p>This note may have been deleted or is not available on this device.</p></section>;
  }

  async function handleDelete() {
    if (!window.confirm(`Delete “${note.title}”? This cannot be undone.`)) return;
    try { await remove(note.id); navigate('/'); } catch { /* surfaced by NotesProvider */ }
  }

  async function togglePin() {
    try { await update(note.id, { is_pinned: !note.is_pinned }); } catch { /* surfaced by NotesProvider */ }
  }

  async function toggleArchive() {
    try { await update(note.id, { is_archived: !note.is_archived }); navigate('/'); } catch { /* surfaced by NotesProvider */ }
  }

  return (
    <article className="page detail-page">
      <div className="detail-topline">
        <Link className="back-link" to="/"><ArrowLeft size={16} /> All notes</Link>
        <div className="detail-actions">
          <button type="button" className="button button-secondary" onClick={togglePin}>{note.is_pinned ? <PinOff size={16} /> : <Pin size={16} />}{note.is_pinned ? 'Unpin' : 'Pin'}</button>
          <button type="button" className="button button-secondary" onClick={toggleArchive}><Archive size={16} />{note.is_archived ? 'Restore' : 'Archive'}</button>
          <Link className="button button-primary" to={`/notes/${note.id}/edit`}><Pencil size={16} /> Edit</Link>
          <button type="button" className="icon-button danger-button" aria-label="Delete note" title="Delete note" onClick={handleDelete}><Trash2 size={17} /></button>
        </div>
      </div>
      <div className="detail-card">
        <div className="detail-meta"><span><CalendarDays size={14} /> Updated {new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(note.updated_at))}</span>{note.is_pinned && <span><Pin size={13} /> Pinned</span>}</div>
        <h1>{note.title}</h1>
        {note.tags?.length > 0 && <div className="tag-list detail-tags">{note.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div>}
        {image && <img className="detail-image" src={image} alt={`Attachment for ${note.title}`} />}
        {note.content ? <div className="note-full-content">{note.content}</div> : <p className="muted-copy"><ImageIcon size={15} /> No written content</p>}
        <div className="detail-created">Created {new Intl.DateTimeFormat('en', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(note.created_at))}</div>
      </div>
    </article>
  );
}

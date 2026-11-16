import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Archive, GripVertical, Pin, PinOff } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getNoteImage } from '../services/notes';

function UpdatedAt({ date }) {
  const formatted = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(date));
  return <time dateTime={date} title={`Updated ${new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date))}`}>{formatted}</time>;
}

export default function NoteCard({ note, onPin, onArchive, canSort = true }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: note.id,
    disabled: !canSort,
  });
  const [image, setImage] = useState(note.localImageUrl ?? '');

  useEffect(() => {
    let active = true;
    let objectUrl = '';
    async function loadImage() {
      try {
        objectUrl = await getNoteImage(note.id, note.image_paths?.[0], note.localImageId);
        if (active) setImage(objectUrl ?? '');
      } catch {
        if (active) setImage('');
      }
    }
    loadImage();
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [note.id, note.localImageId, note.image_paths]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.55 : undefined,
  };

  return (
    <article ref={setNodeRef} style={style} className={`note-card${isDragging ? ' is-dragging' : ''}`}>
      {image && <Link to={`/notes/${note.id}`} className="note-image" aria-label={`Open ${note.title}`}>
        <img src={image} alt="" loading="lazy" />
      </Link>}
      <div className="note-card-head">
        <div className="note-card-title-row">
          <Link className="note-title" to={`/notes/${note.id}`}>{note.title}</Link>
          {note.is_pinned && <span className="pin-indicator" title="Pinned"><Pin size={14} fill="currentColor" /></span>}
        </div>
        <div className="note-actions">
          <button type="button" className="icon-button drag-handle" aria-label={`Reorder ${note.title}`} title="Drag to reorder" disabled={!canSort} {...attributes} {...listeners}>
            <GripVertical size={17} />
          </button>
          <button type="button" className="icon-button" aria-label={note.is_pinned ? 'Unpin note' : 'Pin note'} title={note.is_pinned ? 'Unpin' : 'Pin'} onClick={() => onPin(note)}>
            {note.is_pinned ? <PinOff size={16} /> : <Pin size={16} />}
          </button>
          <button type="button" className="icon-button" aria-label={note.is_archived ? 'Restore note' : 'Archive note'} title={note.is_archived ? 'Restore' : 'Archive'} onClick={() => onArchive(note)}>
            <Archive size={16} />
          </button>
        </div>
      </div>
      <Link to={`/notes/${note.id}`} className="note-preview-link">
        <p className="note-preview">{note.content || 'No additional text'}</p>
      </Link>
      <div className="note-meta">
        <div className="tag-list">
          {(note.tags ?? []).slice(0, 3).map((tag) => <span className="tag" key={tag}>{tag}</span>)}
          {(note.tags ?? []).length > 3 && <span className="tag tag-more">+{note.tags.length - 3}</span>}
        </div>
        <UpdatedAt date={note.updated_at} />
      </div>
      {note.syncStatus && note.syncStatus !== 'synced' && (
        <span className={`sync-label sync-${note.syncStatus}`}>{note.syncStatus === 'error' ? 'Sync issue' : 'Saved on this device'}</span>
      )}
    </article>
  );
}

import { useEffect, useState } from 'react';
import { ArrowLeft, ImagePlus, Save, X } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { database } from '../lib/database';
import { useNotes } from '../hooks/useNotes';
import { getNoteImage } from '../services/notes';
import { getImageUrl } from '../services/notes';

const imageTypes = ['image/jpeg', 'image/png', 'image/webp'];
const maxImageSize = 5 * 1024 * 1024;

export default function NoteEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { notes, save } = useNotes();
  const existing = id ? notes.find((note) => note.id === id) : null;
  const [title, setTitle] = useState(existing?.title ?? '');
  const [content, setContent] = useState(existing?.content ?? '');
  const [tagsText, setTagsText] = useState((existing?.tags ?? []).join(', '));
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(existing?.localImageUrl ?? '');
  const [removeImage, setRemoveImage] = useState(false);
  const [validation, setValidation] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!existing) return;
    setTitle(existing.title);
    setContent(existing.content);
    setTagsText((existing.tags ?? []).join(', '));
    setRemoveImage(false);
  }, [existing?.id]);

  useEffect(() => {
    let objectUrl;
    let active = true;
    async function loadImage() {
      if (!existing) return;
      try {
        objectUrl = await getNoteImage(existing.id, existing.image_paths?.[0], existing.localImageId);
        if (active) setPreview(objectUrl ?? '');
      } catch {
        if (active) setPreview('');
      }
    }
    loadImage();
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [existing?.id, existing?.localImageId]);

  useEffect(() => {
    if (!imageFile) return undefined;
    const url = URL.createObjectURL(imageFile);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  function chooseImage(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!imageTypes.includes(file.type)) {
      setValidation('Choose a JPEG, PNG, or WebP image.');
      event.target.value = '';
      return;
    }
    if (file.size > maxImageSize) {
      setValidation('Images must be 5 MB or smaller.');
      event.target.value = '';
      return;
    }
    setValidation('');
    setImageFile(file);
    setRemoveImage(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!title.trim()) {
      setValidation('Give your note a title before saving.');
      return;
    }
    if (title.trim().length > 160) {
      setValidation('Titles must be 160 characters or fewer.');
      return;
    }
    if (content.length > 100000) {
      setValidation('Note content is too long.');
      return;
    }
    setSaving(true);
    try {
      const tags = tagsText.split(/[,\n]/).map((tag) => tag.trim()).filter(Boolean);
      const note = await save({ title, content, tags, imageFile, removeImage }, id);
      navigate(`/notes/${note.id}`);
    } catch (error) {
      setValidation(error.message || 'Could not save your note.');
      setSaving(false);
    }
  }

  return (
    <section className="page editor-page">
      <Link className="back-link" to={id ? `/notes/${id}` : '/'}><ArrowLeft size={16} /> Back to {id ? 'note' : 'notes'}</Link>
      <form className="editor-card" onSubmit={handleSubmit}>
        <div className="editor-heading">
          <div><p className="eyebrow">{id ? 'MAKE IT YOURS' : 'A NEW THOUGHT'}</p><h1>{id ? 'Edit note' : 'New note'}</h1></div>
          <span className="editor-private">Private by default</span>
        </div>
        <label className="form-label" htmlFor="note-title">Title <span>Required</span></label>
        <input id="note-title" className="text-input title-input" maxLength={160} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Give this note a name" autoFocus />
        <label className="form-label" htmlFor="note-content">Your thoughts</label>
        <textarea id="note-content" className="text-input content-input" value={content} maxLength={100000} onChange={(event) => setContent(event.target.value)} placeholder="Start writing here..." />
        <label className="form-label" htmlFor="note-tags">Tags <span>Separate with commas</span></label>
        <input id="note-tags" className="text-input" value={tagsText} onChange={(event) => setTagsText(event.target.value)} placeholder="Ideas, work, personal" />
        <div className="form-label image-label"><span>Image</span><span>JPEG, PNG or WebP · up to 5 MB</span></div>
        {preview && <div className="image-preview"><img src={preview} alt="Selected note attachment preview" /><button type="button" className="icon-button remove-image" aria-label="Remove image" onClick={() => { setPreview(''); setImageFile(null); setRemoveImage(true); }}><X size={16} /></button></div>}
        <label className="button button-secondary image-picker">
          <ImagePlus size={16} /> {preview ? 'Replace image' : 'Add an image'}
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseImage} />
        </label>
        {validation && <p className="form-error" role="alert">{validation}</p>}
        <div className="editor-footer">
          <span className="autosave-note">Saved on this device first</span>
          <div className="button-row">
            <Link className="button button-quiet" to={id ? `/notes/${id}` : '/'}>Cancel</Link>
            <button className="button button-primary" type="submit" disabled={saving}><Save size={16} /> {saving ? 'Saving…' : 'Save note'}</button>
          </div>
        </div>
      </form>
    </section>
  );
}

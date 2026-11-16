import axios from 'axios';
import { database } from '../lib/database';
import { isSupabaseConfigured, restClient, supabase } from '../lib/supabase';

const createId = () => crypto.randomUUID();
const ACTIVE_SESSION_KEY = 'menotes.active-session.v1';

function uniqueTags(tags) {
  const seen = new Set();
  return tags
    .map((tag) => tag.trim())
    .filter((tag) => {
      const key = tag.toLocaleLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function stripLocalFields(note) {
  const { syncStatus, localImageId, localImageUrl, ...remoteNote } = note;
  return remoteNote;
}

async function enqueue(noteId, type, payload) {
  const existing = await database.mutations.where('noteId').equals(noteId).first();
  await database.mutations.put({
    id: existing?.id ?? createId(),
    noteId,
    type,
    payload,
    createdAt: new Date().toISOString(),
  });
}

export function getActiveSessionId() {
  return localStorage.getItem(ACTIVE_SESSION_KEY) ?? '';
}

export async function listLocalNotes(sessionId = getActiveSessionId()) {
  const allNotes = await database.notes.orderBy('updated_at').reverse().toArray();
  return allNotes.filter((note) => (note.session_id ?? '') === sessionId);
}

export async function openNoteSession(sessionId, passphrase) {
  if (!isSupabaseConfigured) throw new Error('Set up Supabase in Settings to use shared sessions.');
  const normalizedId = sessionId.trim().toLowerCase();
  if (normalizedId.length < 3 || normalizedId.length > 64) {
    throw new Error('Session ID must be between 3 and 64 characters.');
  }
  if (!/^[a-z0-9 ._-]+$/.test(normalizedId)) {
    throw new Error('Session ID can use letters, numbers, spaces, dots, underscores, and hyphens.');
  }
  if (passphrase.length < 10 || passphrase.length > 72 || new TextEncoder().encode(passphrase).length > 72) {
    throw new Error('Passphrase must be 10 to 72 characters and at most 72 bytes.');
  }
  let response;
  try {
    response = await restClient.post('/rpc/open_note_session', {
      p_session_id: normalizedId,
      p_passphrase: passphrase,
    });
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message || 'Could not open this session.');
  }
  const resolvedId = typeof response.data === 'string'
    ? response.data
    : response.data?.open_note_session ?? response.data?.session_id;
  if (typeof resolvedId !== 'string' || !resolvedId) {
    throw new Error('Supabase returned an invalid session response.');
  }
  localStorage.setItem(ACTIVE_SESSION_KEY, resolvedId);
  return resolvedId;
}

export function leaveNoteSession() {
  localStorage.removeItem(ACTIVE_SESSION_KEY);
}

export async function fetchNotes(sessionId = getActiveSessionId()) {
  const cached = await listLocalNotes(sessionId);
  if (!isSupabaseConfigured || !navigator.onLine) return { notes: cached, source: 'local' };
  try {
    await ensureSession();
    const response = await restClient.get('/notes', {
      params: {
        select: '*',
        order: 'is_pinned.desc,sort_order.asc,updated_at.desc',
        session_id: sessionId ? `eq.${sessionId}` : 'is.null',
      },
    });
    const serverNotes = response.data;
    await database.transaction('rw', database.notes, async () => {
      const serverIds = new Set(serverNotes.map((note) => note.id));
      const cachedInScope = await database.notes.toArray();
      for (const local of cachedInScope) {
        if ((local.session_id ?? '') === sessionId && local.syncStatus === 'synced' && !serverIds.has(local.id)) {
          await database.notes.delete(local.id);
        }
      }
      for (const note of serverNotes) {
        const local = await database.notes.get(note.id);
        if (!local || local.syncStatus === 'synced' || local.updated_at <= note.updated_at) {
          await database.notes.put({ ...note, syncStatus: 'synced' });
        }
      }
    });
    return { notes: await listLocalNotes(sessionId), source: 'remote' };
  } catch (error) {
    return { notes: cached, source: 'local', error };
  }
}

async function ensureSession() {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  if (session) return session;
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  return data.session;
}

export async function getImageUrl(path) {
  if (!supabase || !path || !navigator.onLine) return null;
  const { data, error } = await supabase.storage.from('note-images').createSignedUrl(path, 3600);
  if (error) throw error;
  return data.signedUrl;
}

export async function getNoteImage(noteId, path, localImageId) {
  const imageId = localImageId ?? (path ? `cache:${path}` : null);
  if (!imageId) return null;
  const cached = await database.images.get(imageId);
  if (cached?.blob) return URL.createObjectURL(cached.blob);
  if (!path || !navigator.onLine) return null;
  const signedUrl = await getImageUrl(path);
  if (!signedUrl) return null;
  const response = await axios.get(signedUrl, { responseType: 'blob', timeout: 12000 });
  await database.images.put({
    id: `cache:${path}`,
    noteId,
    blob: response.data,
    name: 'cached-note-image',
  });
  return URL.createObjectURL(response.data);
}

export async function saveNote(input, existingId) {
  const now = new Date().toISOString();
  const current = existingId ? await database.notes.get(existingId) : null;
  const id = existingId ?? createId();
  const note = {
    id,
    user_id: current?.user_id ?? '',
    title: input.title.trim(),
    content: input.content,
    tags: uniqueTags(input.tags),
    session_id: (current?.session_id ?? getActiveSessionId()) || null,
    image_paths: input.imageFile || input.removeImage ? [] : current?.image_paths ?? [],
    is_pinned: current?.is_pinned ?? false,
    is_archived: current?.is_archived ?? false,
    sort_order: current?.sort_order ?? Date.now(),
    created_at: current?.created_at ?? now,
    updated_at: now,
    syncStatus: 'pending',
    localImageId: current?.localImageId,
    _deleteImagePaths: input.imageFile || input.removeImage ? current?.image_paths ?? [] : [],
  };
  await database.transaction('rw', database.notes, database.images, database.mutations, async () => {
    if (input.imageFile || input.removeImage) {
      const cachedImages = await database.images.where('noteId').equals(id).toArray();
      await database.images.bulkDelete(cachedImages.filter((image) => image.id.startsWith('cache:')).map((image) => image.id));
    }
    if (input.imageFile && current?.localImageId) {
      await database.images.delete(current.localImageId);
    }
    await database.notes.put(note);
    if (input.imageFile) {
      const localImageId = createId();
      await database.images.put({ id: localImageId, noteId: id, blob: input.imageFile, name: input.imageFile.name });
      note.localImageId = localImageId;
      await database.notes.put(note);
    } else if (input.removeImage) {
      const image = await database.images.where('noteId').equals(id).first();
      if (image) await database.images.delete(image.id);
      note.localImageId = undefined;
      await database.notes.put(note);
    }
    await enqueue(id, 'upsert', stripLocalFields(note));
  });
  return note;
}

export async function updateNoteProperties(id, updates) {
  const note = await database.notes.get(id);
  if (!note) throw new Error('This note is no longer available.');
  const updated = { ...note, ...updates, updated_at: new Date().toISOString(), syncStatus: 'pending' };
  await database.transaction('rw', database.notes, database.mutations, async () => {
    await database.notes.put(updated);
    await enqueue(id, 'upsert', stripLocalFields(updated));
  });
  return updated;
}

export async function deleteNote(id) {
  const note = await database.notes.get(id);
  if (!note) return;
  await database.transaction('rw', database.notes, database.images, database.mutations, async () => {
    await database.notes.delete(id);
    await database.images.where('noteId').equals(id).delete();
    await enqueue(id, 'delete', { id, image_paths: note.image_paths ?? [] });
  });
}

export async function reorderNotes(orderedIds) {
  await database.transaction('rw', database.notes, database.mutations, async () => {
    for (const [index, id] of orderedIds.entries()) {
      const note = await database.notes.get(id);
      if (!note) continue;
      const updated = { ...note, sort_order: index, updated_at: new Date().toISOString(), syncStatus: 'pending' };
      await database.notes.put(updated);
      await enqueue(id, 'upsert', stripLocalFields(updated));
    }
  });
}

async function syncUpsert(mutation) {
  const session = await ensureSession();
  const { _deleteImagePaths = [], ...notePayload } = stripLocalFields(mutation.payload);
  const payload = { ...notePayload, user_id: session.user.id };
  await restClient.post('/notes', payload, {
    params: { on_conflict: 'id' },
    headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
  });
  const localImage = await database.images.where('noteId').equals(mutation.noteId).first();
  if (localImage) {
    const extension = localImage.blob.type === 'image/png' ? 'png' : localImage.blob.type === 'image/webp' ? 'webp' : 'jpg';
    const storageOwner = payload.session_id || session.user.id;
    const path = `${storageOwner}/${mutation.noteId}/${localImage.id}.${extension}`;
    const { error: uploadError } = await supabase.storage.from('note-images').upload(path, localImage.blob, {
      contentType: localImage.blob.type,
      upsert: true,
    });
    if (uploadError) throw uploadError;
    const imagePaths = [path];
    await restClient.patch('/notes', { image_paths: imagePaths }, { params: { id: `eq.${mutation.noteId}` } });
    await database.notes.update(mutation.noteId, { image_paths: imagePaths, localImageId: undefined });
    await database.images.delete(localImage.id);
  }
  if (_deleteImagePaths.length) {
    const { error } = await supabase.storage.from('note-images').remove(_deleteImagePaths);
    if (error) throw error;
  }
  await database.notes.update(mutation.noteId, {
    user_id: session.user.id,
    syncStatus: 'synced',
    _deleteImagePaths: undefined,
  });
}

let syncInFlight = null;
export function syncPending() {
  if (syncInFlight) return syncInFlight;
  syncInFlight = processSyncQueue().finally(() => { syncInFlight = null; });
  return syncInFlight;
}

async function processSyncQueue() {
  if (!isSupabaseConfigured) throw new Error('Add Supabase credentials in .env before syncing.');
  if (!navigator.onLine) throw new Error('You are offline. Try again when you are connected.');
  const mutations = await database.mutations.orderBy('createdAt').toArray();
  for (const mutation of mutations) {
    try {
      if (mutation.type === 'delete') {
        await restClient.delete('/notes', { params: { id: `eq.${mutation.noteId}` } });
        const imagePaths = mutation.payload?.image_paths ?? [];
        if (imagePaths.length && supabase) {
          const { error } = await supabase.storage.from('note-images').remove(imagePaths);
          if (error) throw error;
        }
      } else {
        await syncUpsert(mutation);
      }
      await database.mutations.delete(mutation.id);
    } catch (error) {
      if (mutation.type === 'upsert') await database.notes.update(mutation.noteId, { syncStatus: 'error' });
      throw error;
    }
  }
}

import Dexie from 'dexie';

export const database = new Dexie('iera-notes');
database.version(1).stores({
  notes: 'id, updated_at, is_pinned, is_archived, sort_order, syncStatus',
  mutations: 'id, noteId, createdAt',
  images: 'id, noteId',
});

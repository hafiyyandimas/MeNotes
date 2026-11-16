import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { NotesProvider } from '../hooks/useNotes';
import { SettingsProvider } from '../hooks/useSettings';
import AppShell from '../components/AppShell';
import NotesPage from '../pages/NotesPage';
import NoteEditorPage from '../pages/NoteEditorPage';
import NoteDetailPage from '../pages/NoteDetailPage';
import SettingsPage from '../pages/SettingsPage';
import AboutPage from '../pages/AboutPage';

export default function App() {
  return (
    <SettingsProvider>
      <NotesProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AppShell />}>
              <Route index element={<NotesPage />} />
              <Route path="notes/new" element={<NoteEditorPage />} />
              <Route path="notes/:id/edit" element={<NoteEditorPage />} />
              <Route path="notes/:id" element={<NoteDetailPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="about" element={<AboutPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </NotesProvider>
    </SettingsProvider>
  );
}

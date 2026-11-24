import { ContactMessage, SavedProject } from '../types/vastuva';

const SAVED_PROJECTS_KEY = 'vastuva_saved_projects_v1';
const CONTACT_MESSAGES_KEY = 'vastuva_contact_messages_v1';

export function loadSavedProjects(): SavedProject[] {
  try {
    const raw = window.localStorage.getItem(SAVED_PROJECTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveProjectToStorage(project: SavedProject): SavedProject[] {
  const existing = loadSavedProjects();
  const filtered = existing.filter((p) => p.id !== project.id);
  const updated = [project, ...filtered].slice(0, 25);
  try {
    window.localStorage.setItem(SAVED_PROJECTS_KEY, JSON.stringify(updated));
  } catch {
    // Ignore quota errors gracefully
  }
  return updated;
}

export function deleteSavedProject(id: string): SavedProject[] {
  const existing = loadSavedProjects();
  const updated = existing.filter((p) => p.id !== id);
  try {
    window.localStorage.setItem(SAVED_PROJECTS_KEY, JSON.stringify(updated));
  } catch {
    // Ignore quota errors gracefully
  }
  return updated;
}

export function loadContactMessages(): ContactMessage[] {
  try {
    const raw = window.localStorage.getItem(CONTACT_MESSAGES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveContactMessage(msg: ContactMessage): ContactMessage[] {
  const existing = loadContactMessages();
  const updated = [msg, ...existing].slice(0, 25);
  try {
    window.localStorage.setItem(CONTACT_MESSAGES_KEY, JSON.stringify(updated));
  } catch {
    // Ignore quota errors gracefully
  }
  return updated;
}

export function deleteContactMessage(id: string): ContactMessage[] {
  const existing = loadContactMessages();
  const updated = existing.filter((m) => m.id !== id);
  try {
    window.localStorage.setItem(CONTACT_MESSAGES_KEY, JSON.stringify(updated));
  } catch {
    // Ignore quota errors gracefully
  }
  return updated;
}

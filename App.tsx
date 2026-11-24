import { useEffect, useState } from 'react';
import { AppSection, ContactMessage, FloorPlanResult, ProjectInput, SavedProject } from './types/vastuva';
import { DEFAULT_PROJECT_INPUT } from './engine/defaults';
import {
  deleteContactMessage,
  deleteSavedProject,
  loadContactMessages,
  loadSavedProjects,
  saveContactMessage,
  saveProjectToStorage,
} from './engine/storage';
import { Navbar } from './components/Navbar';
import { HomePage } from './components/HomePage';
import { DesignStudio } from './components/DesignStudio';
import { AboutPage } from './components/AboutPage';
import { ContactPage } from './components/ContactPage';
import { Footer } from './components/Footer';

export default function App() {
  const isAutostart =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('autostart') === '1';

  const [activeSection, setActiveSection] = useState<AppSection>(
    isAutostart ? 'design' : 'home'
  );
  const [studioInitialTab, setStudioInitialTab] = useState<'wizard' | 'output'>(
    isAutostart ? 'output' : 'wizard'
  );
  const [projectInput, setProjectInput] = useState<ProjectInput>(DEFAULT_PROJECT_INPUT);
  const [layoutSeed, setLayoutSeed] = useState(0);
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>(() =>
    loadSavedProjects()
  );
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>(() =>
    loadContactMessages()
  );
  const [justSavedMessage, setJustSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    document.body.dataset.section = activeSection;
  }, [activeSection]);

  const handleNavigate = (section: AppSection, anchorId?: string) => {
    setActiveSection(section);
    if (section === 'design') {
      setStudioInitialTab('wizard');
    }
    window.setTimeout(() => {
      if (anchorId && anchorId !== 'top') {
        const el = document.getElementById(anchorId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
          return;
        }
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 40);
  };

  const handleSaveProject = (plan: FloorPlanResult, estimatedCost: number) => {
    const entry: SavedProject = {
      id: `proj-${Date.now()}`,
      savedAt: new Date().toISOString(),
      input: JSON.parse(JSON.stringify(projectInput)),
      seed: layoutSeed,
      totalBuiltUpAreaSqFt: plan.totalBuiltUpAreaSqFt,
      estimatedCost,
    };
    const updated = saveProjectToStorage(entry);
    setSavedProjects(updated);
    setJustSavedMessage(`Saved "${projectInput.projectName}" to local browser storage.`);
    window.setTimeout(() => setJustSavedMessage(null), 4000);
  };

  const handleLoadProject = (project: SavedProject) => {
    setProjectInput(JSON.parse(JSON.stringify(project.input)));
    setLayoutSeed(project.seed);
    setStudioInitialTab('output');
    setActiveSection('design');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteProject = (id: string) => {
    setSavedProjects(deleteSavedProject(id));
  };

  const handleSubmitContact = (msg: Omit<ContactMessage, 'id' | 'submittedAt'>) => {
    const entry: ContactMessage = {
      ...msg,
      id: `msg-${Date.now()}`,
      submittedAt: new Date().toISOString(),
    };
    setContactMessages(saveContactMessage(entry));
  };

  const handleDeleteContact = (id: string) => {
    setContactMessages(deleteContactMessage(id));
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#F4EFE6] text-[#172B36]">
      <Navbar activeSection={activeSection} onNavigate={handleNavigate} />

      <main className="flex-1">
        {activeSection === 'home' && (
          <HomePage
            savedProjects={savedProjects}
            onStartDesigning={() => handleNavigate('design')}
            onLoadProject={handleLoadProject}
            onNavigate={handleNavigate}
          />
        )}

        {activeSection === 'design' && (
          <DesignStudio
            input={projectInput}
            seed={layoutSeed}
            initialViewTab={studioInitialTab}
            savedProjects={savedProjects}
            onInputChange={setProjectInput}
            onSeedChange={setLayoutSeed}
            onSaveProject={handleSaveProject}
            onLoadProject={handleLoadProject}
            onDeleteProject={handleDeleteProject}
            justSavedMessage={justSavedMessage}
          />
        )}

        {activeSection === 'about' && <AboutPage />}

        {activeSection === 'contact' && (
          <ContactPage
            messages={contactMessages}
            onSubmitMessage={handleSubmitContact}
            onDeleteMessage={handleDeleteContact}
          />
        )}
      </main>

      <Footer onNavigate={handleNavigate} />
    </div>
  );
}

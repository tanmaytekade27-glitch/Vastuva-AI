import React from 'react';
import { Bookmark, FolderOpen, Trash2 } from 'lucide-react';
import { SavedProject } from '../types/vastuva';
import { formatINRLakhs } from '../engine/budgetCalculator';

interface SavedDesignsPanelProps {
  savedProjects: SavedProject[];
  onSaveCurrent: () => void;
  onLoadProject: (project: SavedProject) => void;
  onDeleteProject: (id: string) => void;
  justSavedMessage: string | null;
}

export const SavedDesignsPanel: React.FC<SavedDesignsPanelProps> = ({
  savedProjects,
  onSaveCurrent,
  onLoadProject,
  onDeleteProject,
  justSavedMessage,
}) => {
  return (
    <section
      aria-label="Saved Projects"
      className="rounded-xl border border-[#172B36]/12 bg-white p-5 sm:p-8"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#172B36]/10 pb-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-[#172B36]">
            Saved Home Projects
          </h2>
          <p className="mt-1 text-xs text-[#667C70]">
            Stored locally in your browser via localStorage — works 100% offline with no login required.
          </p>
        </div>

        <button
          type="button"
          onClick={onSaveCurrent}
          className="inline-flex min-h-[42px] items-center gap-2 rounded-lg bg-[#172B36] px-5 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#0F1E26]"
        >
          <Bookmark className="h-4 w-4 text-[#C49A60]" />
          Save Current Design
        </button>
      </div>

      {justSavedMessage && (
        <div
          role="status"
          className="mt-4 rounded-lg border border-[#667C70]/35 bg-[#E6ECE8]/70 px-4 py-2.5 text-xs font-medium text-[#172B36]"
        >
          {justSavedMessage}
        </div>
      )}

      {savedProjects.length === 0 ? (
        <div className="mt-6 rounded-lg border border-dashed border-[#172B36]/20 bg-[#FAF7F2] p-8 text-center">
          <p className="text-sm font-medium text-[#172B36]">No saved home designs yet.</p>
          <p className="mt-1 text-xs text-[#667C70]">
            Click &ldquo;Save Current Design&rdquo; above to keep a copy of your plot layout, 3D model configuration, and budget.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {savedProjects.map((project) => (
            <article
              key={project.id}
              className="flex flex-col justify-between rounded-xl border border-[#172B36]/12 bg-[#FAF7F2] p-5"
            >
              <div>
                <h3 className="font-semibold text-[#172B36]">{project.input.projectName}</h3>
                <p className="mt-1 text-xs text-[#667C70]">
                  {project.input.plot.widthFt} × {project.input.plot.lengthFt} ft · {project.input.floors.floorConfig} · {project.input.design.style}
                </p>
                <p className="mt-2 font-mono text-xs font-semibold text-[#172B36] tabular-nums">
                  {project.totalBuiltUpAreaSqFt.toLocaleString()} sq ft · {formatINRLakhs(project.estimatedCost)}
                </p>
                <p className="mt-1 text-[11px] text-[#667C70]">
                  Saved {new Date(project.savedAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between gap-2 border-t border-[#172B36]/10 pt-3">
                <button
                  type="button"
                  onClick={() => onLoadProject(project)}
                  aria-label={`Load ${project.input.projectName}`}
                  className="inline-flex min-h-[38px] items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-[#172B36] border border-[#172B36]/15 hover:border-[#C49A60]"
                >
                  <FolderOpen className="h-3.5 w-3.5 text-[#9F7840]" />
                  Load
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteProject(project.id)}
                  aria-label={`Delete ${project.input.projectName}`}
                  className="inline-flex min-h-[38px] items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

import React, { useMemo, useState } from 'react';
import { Sliders, Grid, Box, Calculator, Bookmark } from 'lucide-react';
import { BudgetInputs, FloorPlanResult, ProjectInput, SavedProject } from '../types/vastuva';
import { generateFloorPlan } from '../engine/floorplanGenerator';
import { calculateConstructionBudget } from '../engine/budgetCalculator';
import { DesignWizard } from './DesignWizard';
import { FloorPlan2DCanvas } from './FloorPlan2DCanvas';
import { House3DViewer } from './House3DViewer';
import { BudgetCalculator } from './BudgetCalculator';
import { SavedDesignsPanel } from './SavedDesignsPanel';

interface DesignStudioProps {
  input: ProjectInput;
  seed: number;
  initialViewTab?: 'wizard' | 'output';
  savedProjects: SavedProject[];
  onInputChange: (next: ProjectInput) => void;
  onSeedChange: (nextSeed: number) => void;
  onSaveProject: (plan: FloorPlanResult, estimatedCost: number) => void;
  onLoadProject: (project: SavedProject) => void;
  onDeleteProject: (id: string) => void;
  justSavedMessage: string | null;
}

type StudioTab = 'wizard' | '2d' | '3d' | 'budget' | 'saved';

export const DesignStudio: React.FC<DesignStudioProps> = ({
  input,
  seed,
  initialViewTab = 'wizard',
  savedProjects,
  onInputChange,
  onSeedChange,
  onSaveProject,
  onLoadProject,
  onDeleteProject,
  justSavedMessage,
}) => {
  const [activeTab, setActiveTab] = useState<StudioTab>(
    initialViewTab === 'output' ? '2d' : 'wizard'
  );
  const [activeFloorIndex, setActiveFloorIndex] = useState(0);
  const [isDrafting, setIsDrafting] = useState(false);

  const plan = useMemo(() => generateFloorPlan(input, seed), [input, seed]);

  const [budgetInputs, setBudgetInputs] = useState<BudgetInputs>(() => ({
    builtUpAreaSqFt: plan.totalBuiltUpAreaSqFt,
    floorsCount: plan.totalFloors,
    quality:
      input.design.budgetTier === 'Low'
        ? 'Low'
        : input.design.budgetTier === 'Premium'
          ? 'Premium'
          : 'Medium',
    locationTier: 'Tier 2 City',
    materialQuality: input.design.budgetTier === 'Premium' ? 'Luxury' : 'Branded',
    customRatePerSqFt:
      input.design.budgetTier === 'Custom' && input.design.customBudgetLakhs > 0
        ? Math.round((input.design.customBudgetLakhs * 100000) / Math.max(100, plan.totalBuiltUpAreaSqFt))
        : 0,
  }));

  // Keep budget area/floors synced when plan regenerates
  const syncedBudgetInputs: BudgetInputs = {
    ...budgetInputs,
    builtUpAreaSqFt: budgetInputs.builtUpAreaSqFt || plan.totalBuiltUpAreaSqFt,
    floorsCount: plan.totalFloors,
  };

  const budgetResult = useMemo(
    () => calculateConstructionBudget(syncedBudgetInputs),
    [syncedBudgetInputs]
  );

  const handleGenerate = () => {
    setIsDrafting(true);
    setBudgetInputs((prev) => ({
      ...prev,
      builtUpAreaSqFt: plan.totalBuiltUpAreaSqFt,
      floorsCount: plan.totalFloors,
      quality:
        input.design.budgetTier === 'Low'
          ? 'Low'
          : input.design.budgetTier === 'Premium'
            ? 'Premium'
            : 'Medium',
      customRatePerSqFt:
        input.design.budgetTier === 'Custom' && input.design.customBudgetLakhs > 0
          ? Math.round(
              (input.design.customBudgetLakhs * 100000) /
                Math.max(100, plan.totalBuiltUpAreaSqFt)
            )
          : 0,
    }));

    window.setTimeout(() => {
      setIsDrafting(false);
      setActiveFloorIndex(0);
      setActiveTab('2d');
    }, 380);
  };

  return (
    <div className="min-h-[80vh] bg-[#F4EFE6] py-10 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Studio Header & Workspace Mode Tabs */}
        <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[#172B36]/10 pb-6 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs font-medium text-[#9F7840]">
              VASTUVA AI Architectural Studio
            </p>
            <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-[#172B36] sm:text-4xl">
              {input.projectName || 'Custom Home Layout'}
            </h1>
            <p className="mt-1 text-xs text-[#667C70] font-mono tabular-nums">
              {input.plot.widthFt}′ × {input.plot.lengthFt}′ Plot · {input.floors.floorConfig} · {plan.totalBuiltUpAreaSqFt.toLocaleString()} sq ft Built-Up · {input.design.style}
            </p>
          </div>

          <div
            role="tablist"
            aria-label="Design studio views"
            className="flex flex-wrap items-center gap-1.5 rounded-xl border border-[#172B36]/12 bg-white p-1.5"
          >
            {[
              { id: 'wizard' as StudioTab, label: 'Brief & Inputs', icon: Sliders },
              { id: '2d' as StudioTab, label: '2D Floor Plan', icon: Grid },
              { id: '3d' as StudioTab, label: '3D House Model', icon: Box },
              { id: 'budget' as StudioTab, label: 'Budget Estimator', icon: Calculator },
              {
                id: 'saved' as StudioTab,
                label: `Saved (${savedProjects.length})`,
                icon: Bookmark,
              },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex min-h-[40px] items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
                    active
                      ? 'bg-[#172B36] text-white'
                      : 'text-[#172B36]/75 hover:bg-[#F4EFE6] hover:text-[#172B36]'
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${active ? 'text-[#C49A60]' : ''}`} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Architectural Drafting Loading State */}
        {isDrafting ? (
          <div className="flex min-h-[420px] flex-col items-center justify-center rounded-xl border border-[#172B36]/12 bg-white p-10 text-center">
            <div className="h-12 w-12 animate-spin rounded-full border-2 border-[#172B36]/15 border-t-[#C49A60]" />
            <h2 className="mt-5 font-display text-2xl font-bold text-[#172B36]">
              Drafting 2D Blueprint &amp; 3D Geometry
            </h2>
            <p className="mt-2 text-sm text-[#667C70]">
              Allocating setbacks, aligning {input.floors.floorConfig} circulation cores, and computing room dimensions...
            </p>
          </div>
        ) : (
          <div>
            {activeTab === 'wizard' && (
              <DesignWizard
                input={input}
                onChange={onInputChange}
                onGenerate={handleGenerate}
              />
            )}

            {activeTab === '2d' && (
              <FloorPlan2DCanvas
                plan={plan}
                input={input}
                budget={budgetResult}
                activeFloorIndex={activeFloorIndex}
                onSelectFloor={setActiveFloorIndex}
                onRegenerateLayout={() => onSeedChange((seed + 1) % 6)}
              />
            )}

            {activeTab === '3d' && (
              <House3DViewer plan={plan} designStyle={input.design.style} />
            )}

            {activeTab === 'budget' && (
              <BudgetCalculator
                inputs={syncedBudgetInputs}
                onChange={setBudgetInputs}
              />
            )}

            {activeTab === 'saved' && (
              <SavedDesignsPanel
                savedProjects={savedProjects}
                onSaveCurrent={() => onSaveProject(plan, budgetResult.totalEstimatedCost)}
                onLoadProject={(proj) => {
                  onLoadProject(proj);
                  setActiveTab('2d');
                }}
                onDeleteProject={onDeleteProject}
                justSavedMessage={justSavedMessage}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

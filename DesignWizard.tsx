import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, AlertTriangle, Sparkles } from 'lucide-react';
import {
  BudgetTier,
  DesignStyle,
  Direction,
  FloorLevelOption,
  KitchenStyle,
  PlotShape,
  ProjectInput,
  RoadSide,
} from '../types/vastuva';
import { comparePlotArea } from '../engine/floorplanGenerator';
import { DEMO_PROJECT_PRESETS } from '../engine/defaults';

interface DesignWizardProps {
  input: ProjectInput;
  onChange: (next: ProjectInput) => void;
  onGenerate: () => void;
}

const STEPS = [
  { id: 1, label: 'Plot Details' },
  { id: 2, label: 'Floor Requirements' },
  { id: 3, label: 'Additional Needs' },
  { id: 4, label: 'Design Style' },
  { id: 5, label: 'Review & Generate' },
];

const PLOT_SHAPES: PlotShape[] = ['Rectangle', 'Square', 'Corner Plot', 'Irregular'];
const DIRECTIONS: Direction[] = [
  'North',
  'East',
  'South',
  'West',
  'North-East',
  'North-West',
  'South-East',
  'South-West',
];
const ROAD_SIDES: RoadSide[] = ['Front', 'Front & Right', 'Front & Left', 'Two Opposite Sides'];
const FLOOR_OPTIONS: FloorLevelOption[] = ['Ground Floor', 'G+1', 'G+2', 'G+3'];
const DESIGN_STYLES: DesignStyle[] = [
  'Modern Indian',
  'Contemporary',
  'Traditional Indian',
  'Minimalist',
  'Luxury Villa',
  'Scandinavian',
];
const BUDGET_TIERS: BudgetTier[] = ['Low', 'Medium', 'Premium', 'Custom'];

export const DesignWizard: React.FC<DesignWizardProps> = ({
  input,
  onChange,
  onGenerate,
}) => {
  const [step, setStep] = useState(1);
  const [validationError, setValidationError] = useState<string | null>(null);

  const areaComparison = comparePlotArea(
    input.plot.areaSqFt,
    input.plot.lengthFt,
    input.plot.widthFt
  );

  const updatePlot = <K extends keyof ProjectInput['plot']>(
    key: K,
    value: ProjectInput['plot'][K]
  ) => {
    setValidationError(null);
    onChange({
      ...input,
      plot: { ...input.plot, [key]: value },
    });
  };

  const updateFloors = <K extends keyof ProjectInput['floors']>(
    key: K,
    value: ProjectInput['floors'][K]
  ) => {
    setValidationError(null);
    onChange({
      ...input,
      floors: { ...input.floors, [key]: value },
    });
  };

  const updateAdditional = <K extends keyof ProjectInput['additional']>(
    key: K,
    value: ProjectInput['additional'][K]
  ) => {
    onChange({
      ...input,
      additional: { ...input.additional, [key]: value },
    });
  };

  const updateDesign = <K extends keyof ProjectInput['design']>(
    key: K,
    value: ProjectInput['design'][K]
  ) => {
    onChange({
      ...input,
      design: { ...input.design, [key]: value },
    });
  };

  const validateStep = (targetStep: number): boolean => {
    if (step === 1 && targetStep > 1) {
      if (!input.projectName.trim()) {
        setValidationError('Please enter a project name to identify your design.');
        return false;
      }
      if (input.plot.lengthFt < 12 || input.plot.widthFt < 12) {
        setValidationError('Plot length and width must each be at least 12 ft.');
        return false;
      }
      if (input.plot.areaSqFt < 150) {
        setValidationError('Plot area must be at least 150 sq ft.');
        return false;
      }
      if (!input.plot.city.trim() || !input.plot.state.trim()) {
        setValidationError('Please enter your city and state for regional planning.');
        return false;
      }
    }
    if (step === 2 && targetStep > 2) {
      if (input.floors.bedrooms < 1 && !input.floors.guestRoom) {
        setValidationError('Select at least 1 bedroom or a guest suite.');
        return false;
      }
    }
    setValidationError(null);
    return true;
  };

  const goToStep = (nextStep: number) => {
    if (validateStep(nextStep)) {
      setStep(nextStep);
    }
  };

  return (
    <section
      aria-label="Home Design Input Wizard"
      className="rounded-xl border border-[#172B36]/12 bg-white p-5 sm:p-8"
    >
      {/* Quick Preset Strip */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-[#172B36]/10 pb-5">
        <div>
          <h2 className="font-display text-2xl font-bold text-[#172B36] sm:text-3xl">
            Architectural Brief Builder
          </h2>
          <p className="mt-1 text-sm text-[#667C70]">
            Complete the 5-step brief or load a sample Indian plot preset.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="preset-select" className="text-xs font-medium text-[#667C70]">
            Quick Preset:
          </label>
          <select
            id="preset-select"
            defaultValue=""
            onChange={(e) => {
              const found = DEMO_PROJECT_PRESETS.find((p) => p.label === e.target.value);
              if (found) {
                onChange(JSON.parse(JSON.stringify(found.input)));
                setValidationError(null);
              }
            }}
            className="min-h-[40px] rounded-lg border border-[#172B36]/20 bg-[#FAF7F2] px-3 py-1.5 text-xs font-medium text-[#172B36] focus:border-[#C49A60] focus:outline-none"
          >
            <option value="" disabled>
              Load sample plot...
            </option>
            {DEMO_PROJECT_PRESETS.map((preset) => (
              <option key={preset.label} value={preset.label}>
                {preset.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Step Indicator */}
      <nav aria-label="Form steps" className="mb-8">
        <ol className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {STEPS.map((s) => {
            const isCurrent = s.id === step;
            const isDone = s.id < step;
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => goToStep(s.id)}
                  className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-xs font-medium transition-colors ${
                    isCurrent
                      ? 'border-[#172B36] bg-[#172B36] text-white'
                      : isDone
                        ? 'border-[#667C70]/40 bg-[#E6ECE8]/60 text-[#172B36]'
                        : 'border-[#172B36]/12 bg-[#FAF7F2] text-[#172B36]/70 hover:border-[#C49A60]'
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-[11px] ${
                      isCurrent
                        ? 'bg-[#C49A60] text-[#172B36]'
                        : isDone
                          ? 'bg-[#667C70] text-white'
                          : 'bg-[#172B36]/10 text-[#172B36]'
                    }`}
                  >
                    {isDone ? <Check className="h-3 w-3" /> : s.id}
                  </span>
                  <span className="truncate">{s.label}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      {validationError && (
        <div
          role="alert"
          className="mb-6 flex items-start gap-3 rounded-lg border border-amber-700/30 bg-amber-50 p-4 text-sm text-amber-950"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
          <span>{validationError}</span>
        </div>
      )}

      {/* STEP 1: PLOT DETAILS */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div className="sm:col-span-2 lg:col-span-3">
              <label htmlFor="project-name" className="block text-sm font-medium text-[#172B36]">
                Project Title
              </label>
              <input
                id="project-name"
                type="text"
                value={input.projectName}
                onChange={(e) => {
                  setValidationError(null);
                  onChange({ ...input, projectName: e.target.value });
                }}
                placeholder="e.g. Surya Courtyard Residence"
                className="mt-1.5 w-full rounded-lg border border-[#172B36]/20 bg-[#FAF7F2] px-3.5 py-2.5 text-sm text-[#172B36] focus:border-[#C49A60] focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="plot-length" className="block text-sm font-medium text-[#172B36]">
                Plot Length (ft)
              </label>
              <input
                id="plot-length"
                type="number"
                min={10}
                max={300}
                value={input.plot.lengthFt}
                onChange={(e) => updatePlot('lengthFt', Number(e.target.value))}
                className="mt-1.5 w-full rounded-lg border border-[#172B36]/20 bg-[#FAF7F2] px-3.5 py-2.5 font-mono text-sm text-[#172B36] tabular-nums focus:border-[#C49A60] focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="plot-width" className="block text-sm font-medium text-[#172B36]">
                Plot Width (ft)
              </label>
              <input
                id="plot-width"
                type="number"
                min={10}
                max={300}
                value={input.plot.widthFt}
                onChange={(e) => updatePlot('widthFt', Number(e.target.value))}
                className="mt-1.5 w-full rounded-lg border border-[#172B36]/20 bg-[#FAF7F2] px-3.5 py-2.5 font-mono text-sm text-[#172B36] tabular-nums focus:border-[#C49A60] focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="plot-area" className="block text-sm font-medium text-[#172B36]">
                  Entered Plot Area (sq ft)
                </label>
                <button
                  type="button"
                  onClick={() => updatePlot('areaSqFt', areaComparison.calculatedAreaSqFt)}
                  className="text-xs font-medium text-[#9F7840] hover:underline"
                >
                  Sync L × W
                </button>
              </div>
              <input
                id="plot-area"
                type="number"
                min={100}
                max={50000}
                value={input.plot.areaSqFt}
                onChange={(e) => updatePlot('areaSqFt', Number(e.target.value))}
                className="mt-1.5 w-full rounded-lg border border-[#172B36]/20 bg-[#FAF7F2] px-3.5 py-2.5 font-mono text-sm text-[#172B36] tabular-nums focus:border-[#C49A60] focus:outline-none"
              />
            </div>
          </div>

          {/* Automatic Length × Width Area Comparison Panel */}
          <div
            className={`rounded-lg border p-4 text-sm ${
              areaComparison.matchesClosely
                ? 'border-[#667C70]/35 bg-[#E6ECE8]/50 text-[#172B36]'
                : 'border-amber-700/35 bg-amber-50 text-amber-950'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-medium">
                Calculated Area (Length × Width):{' '}
                <strong className="font-mono tabular-nums">
                  {areaComparison.calculatedAreaSqFt.toLocaleString()} sq ft
                </strong>
              </span>
              <span className="font-mono text-xs tabular-nums">
                {areaComparison.matchesClosely
                  ? 'Matches entered area'
                  : `Variance: ${areaComparison.differenceSqFt > 0 ? '+' : ''}${areaComparison.differenceSqFt} sq ft (${areaComparison.differencePercent}%)`}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label htmlFor="plot-shape" className="block text-sm font-medium text-[#172B36]">
                Plot Shape
              </label>
              <select
                id="plot-shape"
                value={input.plot.shape}
                onChange={(e) => updatePlot('shape', e.target.value as PlotShape)}
                className="mt-1.5 w-full rounded-lg border border-[#172B36]/20 bg-[#FAF7F2] px-3.5 py-2.5 text-sm text-[#172B36] focus:border-[#C49A60] focus:outline-none"
              >
                {PLOT_SHAPES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="plot-facing" className="block text-sm font-medium text-[#172B36]">
                Plot Facing Direction
              </label>
              <select
                id="plot-facing"
                value={input.plot.facing}
                onChange={(e) => updatePlot('facing', e.target.value as Direction)}
                className="mt-1.5 w-full rounded-lg border border-[#172B36]/20 bg-[#FAF7F2] px-3.5 py-2.5 text-sm text-[#172B36] focus:border-[#C49A60] focus:outline-none"
              >
                {DIRECTIONS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="road-side" className="block text-sm font-medium text-[#172B36]">
                Road Side
              </label>
              <select
                id="road-side"
                value={input.plot.roadSide}
                onChange={(e) => updatePlot('roadSide', e.target.value as RoadSide)}
                className="mt-1.5 w-full rounded-lg border border-[#172B36]/20 bg-[#FAF7F2] px-3.5 py-2.5 text-sm text-[#172B36] focus:border-[#C49A60] focus:outline-none"
              >
                {ROAD_SIDES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="road-width" className="block text-sm font-medium text-[#172B36]">
                Road Width (ft)
              </label>
              <input
                id="road-width"
                type="number"
                min={8}
                max={120}
                value={input.plot.roadWidthFt}
                onChange={(e) => updatePlot('roadWidthFt', Number(e.target.value))}
                className="mt-1.5 w-full rounded-lg border border-[#172B36]/20 bg-[#FAF7F2] px-3.5 py-2.5 font-mono text-sm text-[#172B36] tabular-nums focus:border-[#C49A60] focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="plot-city" className="block text-sm font-medium text-[#172B36]">
                City
              </label>
              <input
                id="plot-city"
                type="text"
                value={input.plot.city}
                onChange={(e) => updatePlot('city', e.target.value)}
                placeholder="e.g. Gwalior"
                className="mt-1.5 w-full rounded-lg border border-[#172B36]/20 bg-[#FAF7F2] px-3.5 py-2.5 text-sm text-[#172B36] focus:border-[#C49A60] focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="plot-state" className="block text-sm font-medium text-[#172B36]">
                State
              </label>
              <input
                id="plot-state"
                type="text"
                value={input.plot.state}
                onChange={(e) => updatePlot('state', e.target.value)}
                placeholder="e.g. Madhya Pradesh"
                className="mt-1.5 w-full rounded-lg border border-[#172B36]/20 bg-[#FAF7F2] px-3.5 py-2.5 text-sm text-[#172B36] focus:border-[#C49A60] focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: FLOOR REQUIREMENTS */}
      {step === 2 && (
        <div className="space-y-6">
          <div>
            <span className="block text-sm font-medium text-[#172B36]">Floor Configuration</span>
            <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {FLOOR_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => updateFloors('floorConfig', opt)}
                  className={`min-h-[44px] rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors ${
                    input.floors.floorConfig === opt
                      ? 'border-[#172B36] bg-[#172B36] text-white'
                      : 'border-[#172B36]/20 bg-[#FAF7F2] text-[#172B36] hover:border-[#C49A60]'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { key: 'bedrooms' as const, label: 'Bedrooms', min: 0, max: 8 },
              { key: 'bathrooms' as const, label: 'Bathrooms', min: 1, max: 8 },
              { key: 'kitchens' as const, label: 'Kitchens', min: 1, max: 3 },
              { key: 'livingRooms' as const, label: 'Living Rooms', min: 1, max: 3 },
            ].map((item) => (
              <div
                key={item.key}
                className="rounded-lg border border-[#172B36]/15 bg-[#FAF7F2] p-4"
              >
                <label
                  htmlFor={`count-${item.key}`}
                  className="block text-sm font-medium text-[#172B36]"
                >
                  {item.label}
                </label>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    aria-label={`Decrease ${item.label}`}
                    onClick={() =>
                      updateFloors(
                        item.key,
                        Math.max(item.min, input.floors[item.key] - 1)
                      )
                    }
                    className="flex h-10 w-10 items-center justify-center rounded-md border border-[#172B36]/20 bg-white text-base font-semibold text-[#172B36] hover:bg-[#F4EFE6]"
                  >
                    −
                  </button>
                  <input
                    id={`count-${item.key}`}
                    type="number"
                    min={item.min}
                    max={item.max}
                    value={input.floors[item.key]}
                    onChange={(e) =>
                      updateFloors(
                        item.key,
                        Math.max(item.min, Math.min(item.max, Number(e.target.value) || item.min))
                      )
                    }
                    className="w-14 bg-transparent text-center font-mono text-lg font-semibold text-[#172B36] tabular-nums focus:outline-none"
                  />
                  <button
                    type="button"
                    aria-label={`Increase ${item.label}`}
                    onClick={() =>
                      updateFloors(
                        item.key,
                        Math.min(item.max, input.floors[item.key] + 1)
                      )
                    }
                    className="flex h-10 w-10 items-center justify-center rounded-md border border-[#172B36]/20 bg-white text-base font-semibold text-[#172B36] hover:bg-[#F4EFE6]"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div>
            <span className="block text-sm font-medium text-[#172B36]">
              Dedicated &amp; Outdoor Spaces
            </span>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { key: 'diningRoom' as const, label: 'Dining Room' },
                { key: 'poojaRoom' as const, label: 'Pooja Room' },
                { key: 'studyRoom' as const, label: 'Study Room' },
                { key: 'guestRoom' as const, label: 'Guest Room' },
                { key: 'storeRoom' as const, label: 'Store Room' },
                { key: 'balcony' as const, label: 'Balcony' },
                { key: 'garden' as const, label: 'Garden' },
                { key: 'terrace' as const, label: 'Terrace' },
              ].map((room) => (
                <label
                  key={room.key}
                  className={`flex min-h-[44px] cursor-pointer items-center gap-2.5 rounded-lg border px-3.5 py-2.5 text-sm font-medium transition-colors ${
                    input.floors[room.key]
                      ? 'border-[#172B36] bg-[#E6ECE8]/70 text-[#172B36]'
                      : 'border-[#172B36]/15 bg-[#FAF7F2] text-[#172B36]/75 hover:border-[#C49A60]'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={input.floors[room.key]}
                    onChange={(e) => updateFloors(room.key, e.target.checked)}
                    className="h-4 w-4 accent-[#172B36]"
                  />
                  <span>{room.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: ADDITIONAL REQUIREMENTS */}
      {step === 3 && (
        <div className="space-y-6">
          <div>
            <span className="block text-sm font-medium text-[#172B36]">Kitchen Layout Style</span>
            <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {(['open', 'closed'] as KitchenStyle[]).map((kStyle) => (
                <button
                  key={kStyle}
                  type="button"
                  onClick={() => updateAdditional('kitchenType', kStyle)}
                  className={`min-h-[44px] rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
                    input.additional.kitchenType === kStyle
                      ? 'border-[#172B36] bg-[#172B36] text-white'
                      : 'border-[#172B36]/15 bg-[#FAF7F2] text-[#172B36] hover:border-[#C49A60]'
                  }`}
                >
                  <span className="block font-semibold">
                    {kStyle === 'open' ? 'Open Kitchen' : 'Closed Kitchen'}
                  </span>
                  <span
                    className={`mt-0.5 block text-xs ${
                      input.additional.kitchenType === kStyle ? 'text-white/75' : 'text-[#667C70]'
                    }`}
                  >
                    {kStyle === 'open'
                      ? 'Connected seamlessly with dining and living hall'
                      : 'Partitioned kitchen for odor containment and privacy'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="block text-sm font-medium text-[#172B36]">
              Mobility, Utilities &amp; Environmental Preferences
            </span>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { key: 'carParking' as const, label: 'Car Parking Bay' },
                { key: 'twoWheelerParking' as const, label: 'Two-Wheeler Parking' },
                { key: 'staircase' as const, label: 'Internal Staircase' },
                { key: 'lift' as const, label: 'Residential Lift Shaft' },
                { key: 'attachedBathrooms' as const, label: 'Attached Bathrooms' },
                { key: 'vastuPreferred' as const, label: 'Vastu Preferences' },
                { key: 'naturalLighting' as const, label: 'Natural Lighting Priority' },
                { key: 'ventilation' as const, label: 'Cross-Ventilation Setbacks' },
                { key: 'privacy' as const, label: 'Zoned Bedroom Privacy' },
                { key: 'futureExpansion' as const, label: 'Future Vertical Expansion' },
              ].map((pref) => (
                <label
                  key={pref.key}
                  className={`flex min-h-[44px] cursor-pointer items-center gap-2.5 rounded-lg border px-3.5 py-2.5 text-sm font-medium transition-colors ${
                    input.additional[pref.key]
                      ? 'border-[#172B36] bg-[#E6ECE8]/70 text-[#172B36]'
                      : 'border-[#172B36]/15 bg-[#FAF7F2] text-[#172B36]/75 hover:border-[#C49A60]'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={input.additional[pref.key]}
                    onChange={(e) => updateAdditional(pref.key, e.target.checked)}
                    className="h-4 w-4 accent-[#172B36]"
                  />
                  <span>{pref.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: DESIGN PREFERENCES */}
      {step === 4 && (
        <div className="space-y-6">
          <div>
            <span className="block text-sm font-medium text-[#172B36]">Architectural Style</span>
            <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {DESIGN_STYLES.map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => updateDesign('style', style)}
                  className={`min-h-[44px] rounded-lg border px-4 py-3 text-left text-sm font-semibold transition-colors ${
                    input.design.style === style
                      ? 'border-[#172B36] bg-[#172B36] text-white'
                      : 'border-[#172B36]/15 bg-[#FAF7F2] text-[#172B36] hover:border-[#C49A60]'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="block text-sm font-medium text-[#172B36]">Budget Tier</span>
            <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {BUDGET_TIERS.map((tier) => (
                <button
                  key={tier}
                  type="button"
                  onClick={() => updateDesign('budgetTier', tier)}
                  className={`min-h-[44px] rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors ${
                    input.design.budgetTier === tier
                      ? 'border-[#C49A60] bg-[#C49A60] text-[#172B36]'
                      : 'border-[#172B36]/15 bg-[#FAF7F2] text-[#172B36] hover:border-[#C49A60]'
                  }`}
                >
                  {tier}
                </button>
              ))}
            </div>

            {input.design.budgetTier === 'Custom' && (
              <div className="mt-4 max-w-xs">
                <label htmlFor="custom-budget" className="block text-sm font-medium text-[#172B36]">
                  Target Budget (₹ Lakhs)
                </label>
                <input
                  id="custom-budget"
                  type="number"
                  min={5}
                  max={1000}
                  value={input.design.customBudgetLakhs}
                  onChange={(e) => updateDesign('customBudgetLakhs', Number(e.target.value))}
                  className="mt-1.5 w-full rounded-lg border border-[#172B36]/20 bg-[#FAF7F2] px-3.5 py-2.5 font-mono text-sm text-[#172B36] tabular-nums focus:border-[#C49A60] focus:outline-none"
                />
              </div>
            )}
          </div>

          <div>
            <label htmlFor="custom-notes" className="block text-sm font-medium text-[#172B36]">
              Custom Architectural Notes &amp; Vision
            </label>
            <textarea
              id="custom-notes"
              rows={3}
              value={input.design.description}
              onChange={(e) => updateDesign('description', e.target.value)}
              placeholder="Describe specific lifestyle goals, courtyard wishes, or facade preferences..."
              className="mt-1.5 w-full rounded-lg border border-[#172B36]/20 bg-[#FAF7F2] px-3.5 py-2.5 text-sm text-[#172B36] focus:border-[#C49A60] focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* STEP 5: REVIEW AND GENERATE */}
      {step === 5 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-[#172B36]/12 bg-[#FAF7F2] p-5">
              <div className="flex items-center justify-between border-b border-[#172B36]/10 pb-2">
                <h3 className="text-sm font-semibold text-[#172B36]">Plot &amp; Orientation</h3>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs font-medium text-[#9F7840] hover:underline"
                >
                  Edit
                </button>
              </div>
              <dl className="mt-3 space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-[#667C70]">Project</dt>
                  <dd className="font-medium text-[#172B36]">{input.projectName}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#667C70]">Dimensions</dt>
                  <dd className="font-mono text-[#172B36] tabular-nums">
                    {input.plot.widthFt} × {input.plot.lengthFt} ft ({areaComparison.calculatedAreaSqFt} sq ft)
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#667C70]">Shape &amp; Facing</dt>
                  <dd className="font-medium text-[#172B36]">
                    {input.plot.shape} · {input.plot.facing}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#667C70]">Road Access</dt>
                  <dd className="font-medium text-[#172B36]">
                    {input.plot.roadSide} ({input.plot.roadWidthFt} ft)
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#667C70]">Location</dt>
                  <dd className="font-medium text-[#172B36]">
                    {input.plot.city}, {input.plot.state}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-lg border border-[#172B36]/12 bg-[#FAF7F2] p-5">
              <div className="flex items-center justify-between border-b border-[#172B36]/10 pb-2">
                <h3 className="text-sm font-semibold text-[#172B36]">Floors &amp; Room Program</h3>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-xs font-medium text-[#9F7840] hover:underline"
                >
                  Edit
                </button>
              </div>
              <dl className="mt-3 space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-[#667C70]">Levels</dt>
                  <dd className="font-semibold text-[#172B36]">{input.floors.floorConfig}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#667C70]">Core Rooms</dt>
                  <dd className="font-mono text-[#172B36] tabular-nums">
                    {input.floors.bedrooms} Bed · {input.floors.bathrooms} Bath · {input.floors.kitchens} Kitchen · {input.floors.livingRooms} Living
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="shrink-0 text-[#667C70]">Extras</dt>
                  <dd className="text-right font-medium text-[#172B36]">
                    {[
                      input.floors.diningRoom && 'Dining',
                      input.floors.poojaRoom && 'Pooja',
                      input.floors.studyRoom && 'Study',
                      input.floors.guestRoom && 'Guest',
                      input.floors.storeRoom && 'Store',
                      input.floors.balcony && 'Balcony',
                      input.floors.garden && 'Garden',
                      input.floors.terrace && 'Terrace',
                    ]
                      .filter(Boolean)
                      .join(', ') || 'None'}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-lg border border-[#172B36]/12 bg-[#FAF7F2] p-5 md:col-span-2">
              <div className="flex items-center justify-between border-b border-[#172B36]/10 pb-2">
                <h3 className="text-sm font-semibold text-[#172B36]">
                  Features, Style &amp; Budget Preferences
                </h3>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="text-xs font-medium text-[#9F7840] hover:underline"
                >
                  Edit
                </button>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
                <div>
                  <span className="text-xs text-[#667C70]">Style &amp; Kitchen</span>
                  <p className="font-medium text-[#172B36]">
                    {input.design.style} · {input.additional.kitchenType === 'open' ? 'Open' : 'Closed'} Kitchen
                  </p>
                </div>
                <div>
                  <span className="text-xs text-[#667C70]">Budget Tier</span>
                  <p className="font-medium text-[#172B36]">
                    {input.design.budgetTier}
                    {input.design.budgetTier === 'Custom'
                      ? ` (₹${input.design.customBudgetLakhs} Lakhs)`
                      : ''}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-[#667C70]">Parking &amp; Priorities</span>
                  <p className="font-medium text-[#172B36]">
                    {[
                      input.additional.carParking && 'Car Parking',
                      input.additional.twoWheelerParking && '2-Wheeler',
                      input.additional.lift && 'Lift',
                      input.additional.vastuPreferred && 'Vastu',
                      input.additional.naturalLighting && 'Daylight',
                    ]
                      .filter(Boolean)
                      .join(' · ') || 'Standard'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer Wizard Action Controls */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-[#172B36]/10 pt-5">
        <div>
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-[#172B36]/20 bg-white px-5 py-2.5 text-sm font-medium text-[#172B36] hover:bg-[#FAF7F2]"
            >
              <ArrowLeft className="h-4 w-4" />
              {step === 5 ? 'Edit Details' : 'Previous'}
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {step < 5 ? (
            <button
              type="button"
              onClick={() => goToStep(step + 1)}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[#172B36] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0F1E26]"
            >
              Continue
              <ArrowRight className="h-4 w-4 text-[#C49A60]" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onGenerate}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[#C49A60] px-7 py-3 text-sm font-bold text-[#172B36] transition-colors hover:bg-[#b58b51]"
            >
              <Sparkles className="h-4 w-4" />
              Generate My Home
            </button>
          )}
        </div>
      </div>
    </section>
  );
};

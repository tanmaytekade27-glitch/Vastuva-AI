import React from 'react';
import {
  BASE_RATE_BY_QUALITY,
  calculateConstructionBudget,
  formatINR,
  formatINRLakhs,
} from '../engine/budgetCalculator';
import {
  BudgetInputs,
  ConstructionQuality,
  LocationTier,
  MaterialQuality,
} from '../types/vastuva';

interface BudgetCalculatorProps {
  inputs: BudgetInputs;
  onChange: (next: BudgetInputs) => void;
}

export const BudgetCalculator: React.FC<BudgetCalculatorProps> = ({ inputs, onChange }) => {
  const result = calculateConstructionBudget(inputs);

  const update = <K extends keyof BudgetInputs>(key: K, value: BudgetInputs[K]) => {
    onChange({ ...inputs, [key]: value });
  };

  return (
    <section
      aria-label="Construction Budget Calculator"
      className="rounded-xl border border-[#172B36]/12 bg-white p-5 sm:p-8"
    >
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#172B36]/10 pb-5">
        <div>
          <p className="text-xs font-medium text-[#9F7840]">Financial Estimation Engine</p>
          <h2 className="mt-1 font-display text-2xl font-bold text-[#172B36] sm:text-3xl">
            Construction Budget Calculator
          </h2>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-xs text-[#667C70]">Total Estimated Cost</p>
          <p
            data-testid="budget-total-cost"
            className="font-mono text-2xl font-bold text-[#172B36] tabular-nums sm:text-3xl"
          >
            {formatINR(result.totalEstimatedCost)}
          </p>
          <p className="font-mono text-xs text-[#9F7840] tabular-nums">
            {formatINRLakhs(result.totalEstimatedCost)} · {formatINR(result.effectiveRatePerSqFt)} / sq ft
          </p>
        </div>
      </div>

      {/* Controls Grid */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <label htmlFor="budget-area" className="block text-xs font-semibold text-[#172B36]">
            Total Built-Up Area (sq ft)
          </label>
          <input
            id="budget-area"
            type="number"
            min={200}
            max={50000}
            value={inputs.builtUpAreaSqFt}
            onChange={(e) => update('builtUpAreaSqFt', Number(e.target.value))}
            className="mt-1.5 w-full rounded-lg border border-[#172B36]/20 bg-[#FAF7F2] px-3 py-2 font-mono text-sm text-[#172B36] tabular-nums focus:border-[#C49A60] focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="budget-floors" className="block text-xs font-semibold text-[#172B36]">
            Number of Floors
          </label>
          <input
            id="budget-floors"
            type="number"
            min={1}
            max={6}
            value={inputs.floorsCount}
            onChange={(e) => update('floorsCount', Number(e.target.value))}
            className="mt-1.5 w-full rounded-lg border border-[#172B36]/20 bg-[#FAF7F2] px-3 py-2 font-mono text-sm text-[#172B36] tabular-nums focus:border-[#C49A60] focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="budget-quality" className="block text-xs font-semibold text-[#172B36]">
            Construction Quality
          </label>
          <select
            id="budget-quality"
            value={inputs.quality}
            onChange={(e) => update('quality', e.target.value as ConstructionQuality)}
            className="mt-1.5 w-full rounded-lg border border-[#172B36]/20 bg-[#FAF7F2] px-3 py-2 text-sm text-[#172B36] focus:border-[#C49A60] focus:outline-none"
          >
            <option value="Low">Economy (₹{BASE_RATE_BY_QUALITY.Low}/sf)</option>
            <option value="Medium">Standard Medium (₹{BASE_RATE_BY_QUALITY.Medium}/sf)</option>
            <option value="Premium">Premium Luxury (₹{BASE_RATE_BY_QUALITY.Premium}/sf)</option>
          </select>
        </div>

        <div>
          <label htmlFor="budget-location" className="block text-xs font-semibold text-[#172B36]">
            Location Tier
          </label>
          <select
            id="budget-location"
            value={inputs.locationTier}
            onChange={(e) => update('locationTier', e.target.value as LocationTier)}
            className="mt-1.5 w-full rounded-lg border border-[#172B36]/20 bg-[#FAF7F2] px-3 py-2 text-sm text-[#172B36] focus:border-[#C49A60] focus:outline-none"
          >
            <option value="Metro / Tier 1">Metro / Tier 1 (+15%)</option>
            <option value="Tier 2 City">Tier 2 City (Base)</option>
            <option value="Tier 3 / Town">Tier 3 / Town (-10%)</option>
          </select>
        </div>

        <div>
          <label htmlFor="budget-material" className="block text-xs font-semibold text-[#172B36]">
            Material Grade
          </label>
          <select
            id="budget-material"
            value={inputs.materialQuality}
            onChange={(e) => update('materialQuality', e.target.value as MaterialQuality)}
            className="mt-1.5 w-full rounded-lg border border-[#172B36]/20 bg-[#FAF7F2] px-3 py-2 text-sm text-[#172B36] focus:border-[#C49A60] focus:outline-none"
          >
            <option value="Standard">Standard Grade</option>
            <option value="Branded">Branded ISI Grade</option>
            <option value="Luxury">Luxury Architectural</option>
          </select>
        </div>
      </div>

      {/* Custom Base Rate Override */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-[#172B36]/10 bg-[#FAF7F2] px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="custom-rate" className="text-xs font-semibold text-[#172B36]">
            Custom Assumed Rate (₹ / sq ft, optional):
          </label>
          <input
            id="custom-rate"
            type="number"
            min={0}
            max={15000}
            step={50}
            value={inputs.customRatePerSqFt || ''}
            placeholder={`Auto (${BASE_RATE_BY_QUALITY[inputs.quality]})`}
            onChange={(e) => update('customRatePerSqFt', Math.max(0, Number(e.target.value) || 0))}
            className="w-36 rounded-md border border-[#172B36]/20 bg-white px-3 py-1.5 font-mono text-xs text-[#172B36] tabular-nums focus:border-[#C49A60] focus:outline-none"
          />
          {inputs.customRatePerSqFt > 0 && (
            <button
              type="button"
              onClick={() => update('customRatePerSqFt', 0)}
              className="text-xs font-medium text-[#9F7840] hover:underline"
            >
              Reset to Tier Rate
            </button>
          )}
        </div>
        <span className="font-mono text-xs text-[#667C70] tabular-nums">
          Effective Rate: {formatINR(result.effectiveRatePerSqFt)} / sq ft
        </span>
      </div>

      {/* Visual Stacked Distribution Bar */}
      <div className="mt-6">
        <p className="mb-2 text-xs font-semibold text-[#172B36]">Cost Distribution Visual Chart</p>
        <div
          className="flex h-5 w-full overflow-hidden rounded-lg border border-[#172B36]/15"
          role="img"
          aria-label="Stacked horizontal chart showing percentage cost breakdown across 8 construction phases"
        >
          {result.breakdown.map((item) => (
            <div
              key={item.id}
              style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
              title={`${item.label}: ${item.percentage}% (${formatINR(item.amount)})`}
            />
          ))}
        </div>
      </div>

      {/* 8-Category Breakdown Grid */}
      <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
        {result.breakdown.map((item) => (
          <div
            key={item.id}
            className="flex flex-col justify-between rounded-lg border border-[#172B36]/10 bg-[#FAF7F2] p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span
                  className="h-3 w-3 shrink-0 rounded-sm"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm font-semibold text-[#172B36]">{item.label}</span>
              </div>
              <div className="text-right">
                <span className="block font-mono text-sm font-bold text-[#172B36] tabular-nums">
                  {formatINR(item.amount)}
                </span>
                <span className="font-mono text-[11px] text-[#667C70] tabular-nums">
                  {item.percentage}%
                </span>
              </div>
            </div>
            <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-[#172B36]/10">
              <div
                className="h-full rounded-full"
                style={{ width: `${item.percentage * 3.5}%`, backgroundColor: item.color }}
              />
            </div>
            <p className="mt-2 text-xs text-[#667C70]">{item.notes}</p>
          </div>
        ))}
      </div>

      {/* Mandatory Approximate Estimate Disclaimer */}
      <p className="mt-6 rounded-lg border border-[#172B36]/10 bg-[#F4EFE6] p-4 text-xs leading-relaxed text-[#172B36]/80">
        <strong className="font-semibold text-[#172B36]">Important Notice:</strong> {result.disclaimer}
      </p>
    </section>
  );
};

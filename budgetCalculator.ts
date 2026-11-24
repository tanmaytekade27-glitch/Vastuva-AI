import {
  BudgetBreakdownItem,
  BudgetInputs,
  BudgetResult,
  ConstructionQuality,
  LocationTier,
  MaterialQuality,
} from '../types/vastuva';

export const BASE_RATE_BY_QUALITY: Record<ConstructionQuality, number> = {
  Low: 1450,
  Medium: 1850,
  Premium: 2450,
};

const LOCATION_MULTIPLIER: Record<LocationTier, number> = {
  'Metro / Tier 1': 1.15,
  'Tier 2 City': 1.0,
  'Tier 3 / Town': 0.9,
};

const MATERIAL_MULTIPLIER: Record<MaterialQuality, number> = {
  Standard: 0.92,
  Branded: 1.0,
  Luxury: 1.22,
};

const BREAKDOWN_WEIGHTS: Array<{
  id: string;
  label: string;
  percentage: number;
  color: string;
  notes: string;
}> = [
  {
    id: 'foundation',
    label: 'Foundation & Excavation',
    percentage: 12,
    color: '#172B36',
    notes: 'Earthwork, PCC bed, isolated/combined footings & plinth beam',
  },
  {
    id: 'structural',
    label: 'Structural RCC Work',
    percentage: 24,
    color: '#2A4756',
    notes: 'Columns, beams, slabs, staircase RCC & TMT reinforcement steel',
  },
  {
    id: 'brickwork',
    label: 'Brickwork & Plastering',
    percentage: 14,
    color: '#667C70',
    notes: 'AAC blocks / red bricks, internal & external cement plaster',
  },
  {
    id: 'flooring',
    label: 'Flooring & Tiling',
    percentage: 13,
    color: '#8DA195',
    notes: 'Vitrified tiles / natural stone, skirting & anti-skid bath tiles',
  },
  {
    id: 'electrical',
    label: 'Electrical & Conduits',
    percentage: 8,
    color: '#C49A60',
    notes: 'Concealed copper wiring, modular switches, MCB distribution',
  },
  {
    id: 'plumbing',
    label: 'Plumbing & Sanitary',
    percentage: 9,
    color: '#A98249',
    notes: 'CPVC/UPVC lines, overhead tank, drainage & sanitaryware',
  },
  {
    id: 'painting',
    label: 'Painting & Surface Putty',
    percentage: 7,
    color: '#D5B88E',
    notes: 'Wall putty, primer, interior emulsion & weatherproof exterior coat',
  },
  {
    id: 'finishing',
    label: 'Doors, Windows & Finishing',
    percentage: 13,
    color: '#50646E',
    notes: 'Main teak door, UPVC/aluminium glazing, railings & kitchen counter',
  },
];

export function calculateConstructionBudget(inputs: BudgetInputs): BudgetResult {
  const safeArea = Math.max(100, Number(inputs.builtUpAreaSqFt) || 1000);
  const safeFloors = Math.max(1, Math.min(6, Math.round(Number(inputs.floorsCount) || 1)));
  const baseRate =
    inputs.customRatePerSqFt > 0
      ? inputs.customRatePerSqFt
      : BASE_RATE_BY_QUALITY[inputs.quality];

  const locFactor = LOCATION_MULTIPLIER[inputs.locationTier] ?? 1.0;
  const matFactor = MATERIAL_MULTIPLIER[inputs.materialQuality] ?? 1.0;
  // Multi-story structural factor: +3.5% per additional floor above Ground
  const floorFactor = 1 + (safeFloors - 1) * 0.035;

  const effectiveRatePerSqFt = Math.round(baseRate * locFactor * matFactor * floorFactor);
  const totalEstimatedCost = Math.round(safeArea * effectiveRatePerSqFt);

  let allocatedSum = 0;
  const breakdown: BudgetBreakdownItem[] = BREAKDOWN_WEIGHTS.map((item, idx) => {
    const amount =
      idx === BREAKDOWN_WEIGHTS.length - 1
        ? totalEstimatedCost - allocatedSum
        : Math.round((totalEstimatedCost * item.percentage) / 100);
    allocatedSum += amount;
    return {
      ...item,
      amount,
    };
  });

  return {
    totalEstimatedCost,
    effectiveRatePerSqFt,
    builtUpAreaSqFt: safeArea,
    breakdown,
    disclaimer:
      'Approximate engineering estimate based on thumb-rule sq ft rates for demonstration and planning purposes. Actual costs vary by soil bearing capacity, local labor rates, steel/cement market prices, and site elevation — consult a licensed civil engineer or contractor for a formal BOQ quotation.',
  };
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatINRLakhs(amount: number): string {
  const lakhs = amount / 100000;
  if (lakhs >= 100) {
    return `₹${(lakhs / 100).toFixed(2)} Cr`;
  }
  return `₹${lakhs.toFixed(2)} Lakhs`;
}

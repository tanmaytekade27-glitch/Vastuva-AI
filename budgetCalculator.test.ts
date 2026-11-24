import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateConstructionBudget, formatINR } from './budgetCalculator';

test('budget breakdown sums exactly to total estimated cost across 8 categories', () => {
  const result = calculateConstructionBudget({
    builtUpAreaSqFt: 2000,
    floorsCount: 2,
    quality: 'Medium',
    locationTier: 'Tier 2 City',
    materialQuality: 'Branded',
    customRatePerSqFt: 0,
  });

  assert.equal(result.breakdown.length, 8);
  const sum = result.breakdown.reduce((acc, item) => acc + item.amount, 0);
  assert.equal(sum, result.totalEstimatedCost);
  assert.ok(result.effectiveRatePerSqFt > 1850); // Includes +3.5% for 2nd floor
});

test('custom rate overrides base quality rate and formats INR cleanly', () => {
  const result = calculateConstructionBudget({
    builtUpAreaSqFt: 1000,
    floorsCount: 1,
    quality: 'Low',
    locationTier: 'Tier 2 City',
    materialQuality: 'Branded',
    customRatePerSqFt: 2000,
  });

  assert.equal(result.effectiveRatePerSqFt, 2000);
  assert.equal(result.totalEstimatedCost, 2000000);
  assert.match(formatINR(result.totalEstimatedCost), /20,00,000/);
});

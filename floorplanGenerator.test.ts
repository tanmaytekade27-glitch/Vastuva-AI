import test from 'node:test';
import assert from 'node:assert/strict';
import {
  comparePlotArea,
  generateFloorPlan,
  getCompassRotationForFacing,
} from './floorplanGenerator';
import { DEFAULT_PROJECT_INPUT } from './defaults';
import { ProjectInput } from '../types/vastuva';

test('plot area comparison detects exact match and mismatch', () => {
  const exact = comparePlotArea(1500, 50, 30);
  assert.equal(exact.calculatedAreaSqFt, 1500);
  assert.equal(exact.matchesClosely, true);

  const mismatch = comparePlotArea(2000, 40, 30);
  assert.equal(mismatch.calculatedAreaSqFt, 1200);
  assert.equal(mismatch.matchesClosely, false);
});

test('generates valid multi-floor plan with non-overlapping interior rooms inside footprint', () => {
  const plan = generateFloorPlan(DEFAULT_PROJECT_INPUT, 0);
  assert.equal(plan.isValidFit, true);
  assert.equal(plan.floors.length, 2);
  assert.equal(plan.warnings.length, 0);

  for (const floor of plan.floors) {
    const interior = floor.rooms.filter((r) => !r.isExteriorZone);
    assert.ok(interior.length >= 3, `Expected >= 3 rooms on ${floor.floorLabel}`);

    // Verify all interior rooms stay within footprint bounds
    for (const r of interior) {
      assert.ok(r.x >= floor.footprintX - 0.1, `${r.name} x out of bounds`);
      assert.ok(r.y >= floor.footprintY - 0.1, `${r.name} y out of bounds`);
      assert.ok(
        r.x + r.width <= floor.footprintX + floor.footprintWidth + 0.25,
        `${r.name} right edge exceeds footprint`
      );
      assert.ok(
        r.y + r.height <= floor.footprintY + floor.footprintHeight + 0.25,
        `${r.name} bottom edge exceeds footprint`
      );
    }

    // Verify no pairwise interior room overlap beyond floating rounding tolerance
    for (let i = 0; i < interior.length; i++) {
      for (let j = i + 1; j < interior.length; j++) {
        const a = interior[i];
        const b = interior[j];
        const overlapX = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
        const overlapY = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
        assert.ok(
          overlapX <= 0.25 || overlapY <= 0.25,
          `Overlap detected on ${floor.floorLabel} between ${a.name} and ${b.name}`
        );
      }
    }
  }
});

test('produces distinct layout arrangement when variationSeed changes', () => {
  const plan0 = generateFloorPlan(DEFAULT_PROJECT_INPUT, 0);
  const plan1 = generateFloorPlan(DEFAULT_PROJECT_INPUT, 1);

  const stair0 = plan0.floors[0].rooms.find((r) => r.category === 'staircase');
  const stair1 = plan1.floors[0].rooms.find((r) => r.category === 'staircase');
  assert.ok(stair0 && stair1);
  assert.notEqual(stair0.x, stair1.x);
});

test('flags over-capacity warning when requested rooms exceed tiny plot area', () => {
  const tinyOverloaded: ProjectInput = {
    ...DEFAULT_PROJECT_INPUT,
    plot: {
      ...DEFAULT_PROJECT_INPUT.plot,
      areaSqFt: 450,
      lengthFt: 25,
      widthFt: 18,
    },
    floors: {
      ...DEFAULT_PROJECT_INPUT.floors,
      floorConfig: 'Ground Floor',
      bedrooms: 5,
      bathrooms: 4,
      guestRoom: true,
      studyRoom: true,
      diningRoom: true,
    },
  };

  const plan = generateFloorPlan(tinyOverloaded, 0);
  assert.equal(plan.isValidFit, false);
  assert.ok(plan.warnings.length >= 1);
  assert.ok(plan.recommendations.length >= 1);
});

test('compass rotation aligns North accurately relative to front road', () => {
  assert.equal(getCompassRotationForFacing('South'), 0);
  assert.equal(getCompassRotationForFacing('North'), 180);
  assert.equal(getCompassRotationForFacing('East'), 270);
  assert.equal(getCompassRotationForFacing('West'), 90);
});

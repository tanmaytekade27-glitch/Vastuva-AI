import {
  Direction,
  DoorPlacement,
  FloorLevelOption,
  FloorPlanLayer,
  FloorPlanResult,
  PlacedRoom,
  PlotAreaComparison,
  ProjectInput,
  RoomCategory,
  WindowPlacement,
} from '../types/vastuva';

interface RoomSpec {
  id: string;
  name: string;
  category: RoomCategory;
  targetArea: number;
  minArea: number;
  priority: number;
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

const ROOM_PALETTE: Record<RoomCategory, string> = {
  living: '#EDE4D3',
  bedroom: '#E4EAE6',
  bathroom: '#DCE5E9',
  kitchen: '#F2E2CF',
  dining: '#EFE7D6',
  pooja: '#F6E8CC',
  study: '#E5E7EE',
  guest: '#E7E9E2',
  store: '#E5E2DC',
  staircase: '#D9D5CC',
  lift: '#CFCBC2',
  parking: '#E2E4E6',
  corridor: '#F5F2EC',
  balcony: '#DCE6DF',
  garden: '#D4E2D4',
  terrace: '#EAE6DD',
};

export function getFloorCount(option: FloorLevelOption): number {
  switch (option) {
    case 'Ground Floor':
      return 1;
    case 'G+1':
      return 2;
    case 'G+2':
      return 3;
    case 'G+3':
      return 4;
  }
}

export function getFloorLabel(index: number): string {
  if (index === 0) return 'Ground Floor';
  if (index === 1) return 'First Floor';
  if (index === 2) return 'Second Floor';
  if (index === 3) return 'Third Floor';
  return `Floor ${index}`;
}

/**
 * Returns clockwise rotation in degrees for the North compass arrow,
 * assuming the front road is placed at the bottom of the 2D blueprint.
 */
export function getCompassRotationForFacing(facing: Direction): number {
  const map: Record<Direction, number> = {
    South: 0,
    'South-West': 45,
    West: 90,
    'North-West': 135,
    North: 180,
    'North-East': 225,
    East: 270,
    'South-East': 315,
  };
  return map[facing] ?? 0;
}

export function comparePlotArea(enteredArea: number, lengthFt: number, widthFt: number): PlotAreaComparison {
  const calculatedAreaSqFt = Math.round(lengthFt * widthFt * 100) / 100;
  const safeEntered = Math.max(1, enteredArea);
  const differenceSqFt = Math.round((calculatedAreaSqFt - safeEntered) * 100) / 100;
  const differencePercent = Math.round((Math.abs(differenceSqFt) / safeEntered) * 1000) / 10;
  return {
    enteredAreaSqFt: enteredArea,
    calculatedAreaSqFt,
    differenceSqFt,
    differencePercent,
    matchesClosely: differencePercent <= 5,
  };
}

function roundHalf(val: number): number {
  return Math.round(val * 2) / 2;
}

/**
 * Recursive Architectural Slice & Pack (RASP).
 * Partitions a rectangular buildable region into non-overlapping, proportional rooms.
 */
function sliceRectIntoRooms(
  rect: Rect,
  specs: RoomSpec[],
  floorIndex: number,
  variationSeed: number,
  depth = 0
): PlacedRoom[] {
  if (specs.length === 0 || rect.w <= 0.5 || rect.h <= 0.5) {
    return [];
  }

  if (specs.length === 1) {
    const spec = specs[0];
    const w = Math.round(rect.w * 10) / 10;
    const h = Math.round(rect.h * 10) / 10;
    return [
      {
        id: `${spec.id}-f${floorIndex}`,
        name: spec.name,
        category: spec.category,
        floorIndex,
        x: Math.round(rect.x * 10) / 10,
        y: Math.round(rect.y * 10) / 10,
        width: w,
        height: h,
        areaSqFt: Math.round(w * h),
        color: ROOM_PALETTE[spec.category],
        doors: [],
        windows: [],
      },
    ];
  }

  // Sort deterministically by priority + seed permutation for layout variations
  const ordered = [...specs].sort((a, b) => {
    const modA = ((a.priority + variationSeed * 3) % 7) * 0.1;
    const modB = ((b.priority + variationSeed * 3) % 7) * 0.1;
    return b.targetArea + modB - (a.targetArea + modA);
  });

  // Partition into two balanced area groups
  const totalWeight = ordered.reduce((sum, s) => sum + Math.max(20, s.targetArea), 0);
  const groupA: RoomSpec[] = [];
  const groupB: RoomSpec[] = [];
  let sumA = 0;

  for (let i = 0; i < ordered.length; i++) {
    const item = ordered[i];
    const w = Math.max(20, item.targetArea);
    if (groupA.length === 0 || (sumA + w * 0.5 <= totalWeight * 0.52 && i < ordered.length - 1)) {
      groupA.push(item);
      sumA += w;
    } else {
      groupB.push(item);
    }
  }

  if (groupB.length === 0 && groupA.length > 1) {
    groupB.push(groupA.pop()!);
  }

  const weightA = groupA.reduce((s, item) => s + Math.max(20, item.targetArea), 0);
  const ratio = Math.min(0.75, Math.max(0.25, weightA / totalWeight));

  // Decide split axis based on aspect ratio and variationSeed
  const preferHorizontal =
    rect.h > rect.w * 1.15
      ? true
      : rect.w > rect.h * 1.15
        ? false
        : (depth + variationSeed) % 2 === 0;

  if (preferHorizontal) {
    const hA = Math.max(3.5, Math.min(rect.h - 3.5, roundHalf(rect.h * ratio)));
    const hB = Math.max(3.5, rect.h - hA);
    const rectA: Rect = { x: rect.x, y: rect.y, w: rect.w, h: hA };
    const rectB: Rect = { x: rect.x, y: rect.y + hA, w: rect.w, h: hB };
    return [
      ...sliceRectIntoRooms(rectA, groupA, floorIndex, variationSeed, depth + 1),
      ...sliceRectIntoRooms(rectB, groupB, floorIndex, variationSeed, depth + 1),
    ];
  } else {
    const wA = Math.max(3.5, Math.min(rect.w - 3.5, roundHalf(rect.w * ratio)));
    const wB = Math.max(3.5, rect.w - wA);
    const rectA: Rect = { x: rect.x, y: rect.y, w: wA, h: rect.h };
    const rectB: Rect = { x: rect.x + wA, y: rect.y, w: wB, h: rect.h };
    return [
      ...sliceRectIntoRooms(rectA, groupA, floorIndex, variationSeed, depth + 1),
      ...sliceRectIntoRooms(rectB, groupB, floorIndex, variationSeed, depth + 1),
    ];
  }
}

function attachDoorsAndWindows(
  rooms: PlacedRoom[],
  footprint: Rect,
  floorIndex: number,
  naturalLighting: boolean
): PlacedRoom[] {
  const eps = 0.25;
  const fx2 = footprint.x + footprint.w;
  const fy2 = footprint.y + footprint.h;

  return rooms.map((room, idx) => {
    if (room.isExteriorZone) return room;

    const doors: DoorPlacement[] = [];
    const windows: WindowPlacement[] = [];

    const touchesLeft = Math.abs(room.x - footprint.x) < eps;
    const touchesRight = Math.abs(room.x + room.width - fx2) < eps;
    const touchesTop = Math.abs(room.y - footprint.y) < eps;
    const touchesBottom = Math.abs(room.y + room.height - fy2) < eps;

    // Main entry door on ground floor living / foyer at front (bottom) or inner face
    if (room.category === 'living' && floorIndex === 0) {
      const doorW = Math.min(4, Math.max(3, room.width * 0.3));
      doors.push({
        id: `door-${room.id}-main`,
        x: room.x + room.width * 0.5 - doorW * 0.5,
        y: touchesBottom ? room.y + room.height : room.y,
        wall: touchesBottom ? 'bottom' : 'top',
        widthFt: doorW,
        swing: 'in',
      });
    } else if (room.category !== 'corridor' && room.category !== 'balcony' && room.category !== 'terrace') {
      const doorW = room.category === 'bathroom' || room.category === 'store' || room.category === 'pooja' ? 2.5 : 3;
      // Place door on an interior wall (preferring wall not on exterior boundary)
      if (!touchesBottom && room.width >= doorW + 1) {
        doors.push({
          id: `door-${room.id}`,
          x: room.x + Math.min(1.2, room.width * 0.2),
          y: room.y + room.height,
          wall: 'bottom',
          widthFt: doorW,
          swing: 'in',
        });
      } else if (!touchesTop && room.width >= doorW + 1) {
        doors.push({
          id: `door-${room.id}`,
          x: room.x + Math.min(1.2, room.width * 0.2),
          y: room.y,
          wall: 'top',
          widthFt: doorW,
          swing: 'in',
        });
      } else if (!touchesLeft && room.height >= doorW + 1) {
        doors.push({
          id: `door-${room.id}`,
          x: room.x,
          y: room.y + Math.min(1.2, room.height * 0.2),
          wall: 'left',
          widthFt: doorW,
          swing: 'in',
        });
      } else {
        doors.push({
          id: `door-${room.id}`,
          x: room.x + room.width,
          y: room.y + Math.min(1.2, room.height * 0.2),
          wall: 'right',
          widthFt: Math.min(doorW, Math.max(2, room.height - 0.5)),
          swing: 'in',
        });
      }
    }

    // Windows on exterior walls for daylight & cross ventilation
    if (room.category !== 'staircase' && room.category !== 'lift' && room.category !== 'corridor') {
      const winScale = naturalLighting ? 1.15 : 0.9;
      const winW =
        room.category === 'bathroom' || room.category === 'store'
          ? 2
          : Math.min(5, Math.max(2.5, roundHalf(Math.min(room.width, room.height) * 0.35 * winScale)));

      if (touchesBottom && room.width >= winW + 2 && room.category !== 'parking') {
        windows.push({
          id: `win-${room.id}-b-${idx}`,
          x: room.x + room.width * 0.5 - winW * 0.5,
          y: room.y + room.height,
          wall: 'bottom',
          widthFt: winW,
        });
      }
      if (touchesTop && room.width >= winW + 2) {
        windows.push({
          id: `win-${room.id}-t-${idx}`,
          x: room.x + room.width * 0.5 - winW * 0.5,
          y: room.y,
          wall: 'top',
          widthFt: winW,
        });
      }
      if (touchesLeft && room.height >= winW + 2) {
        windows.push({
          id: `win-${room.id}-l-${idx}`,
          x: room.x,
          y: room.y + room.height * 0.5 - winW * 0.5,
          wall: 'left',
          widthFt: winW,
        });
      }
      if (touchesRight && room.height >= winW + 2) {
        windows.push({
          id: `win-${room.id}-r-${idx}`,
          x: room.x + room.width,
          y: room.y + room.height * 0.5 - winW * 0.5,
          wall: 'right',
          widthFt: winW,
        });
      }
    }

    return {
      ...room,
      doors,
      windows,
    };
  });
}

function buildFloorSpecs(input: ProjectInput, totalFloors: number): RoomSpec[][] {
  const perFloor: RoomSpec[][] = Array.from({ length: totalFloors }, () => []);
  const { floors, additional } = input;

  // Living room(s)
  for (let i = 0; i < Math.max(1, floors.livingRooms); i++) {
    const targetFloor = i === 0 ? 0 : Math.min(i, totalFloors - 1);
    perFloor[targetFloor].push({
      id: `living-${i + 1}`,
      name: i === 0 ? 'Living Hall' : 'Family Lounge',
      category: 'living',
      targetArea: i === 0 ? 210 : 150,
      minArea: 120,
      priority: 10,
    });
  }

  // Kitchen(s)
  for (let i = 0; i < Math.max(1, floors.kitchens); i++) {
    const targetFloor = i === 0 ? 0 : Math.min(i, totalFloors - 1);
    perFloor[targetFloor].push({
      id: `kitchen-${i + 1}`,
      name: additional.kitchenType === 'open' ? 'Open Kitchen' : 'Kitchen',
      category: 'kitchen',
      targetArea: 105,
      minArea: 65,
      priority: 8,
    });
  }

  if (floors.diningRoom) {
    perFloor[0].push({
      id: 'dining-1',
      name: 'Dining Area',
      category: 'dining',
      targetArea: 115,
      minArea: 75,
      priority: 7,
    });
  }

  if (floors.poojaRoom) {
    perFloor[0].push({
      id: 'pooja-1',
      name: 'Pooja Room',
      category: 'pooja',
      targetArea: 36,
      minArea: 20,
      priority: 6,
    });
  }

  if (floors.guestRoom) {
    perFloor[0].push({
      id: 'guest-1',
      name: 'Guest Suite',
      category: 'guest',
      targetArea: 130,
      minArea: 90,
      priority: 6,
    });
  }

  if (floors.storeRoom) {
    perFloor[0].push({
      id: 'store-1',
      name: 'Store Room',
      category: 'store',
      targetArea: 42,
      minArea: 22,
      priority: 3,
    });
  }

  if (floors.studyRoom) {
    const targetFloor = totalFloors > 1 ? 1 : 0;
    perFloor[targetFloor].push({
      id: 'study-1',
      name: 'Study / Studio',
      category: 'study',
      targetArea: 96,
      minArea: 60,
      priority: 5,
    });
  }

  // Distribute bedrooms intelligently across floors:
  // If multi-floor, keep 1 master/elder bedroom on ground floor (if >1 bedrooms) and rest upstairs.
  const totalBedrooms = Math.max(0, floors.bedrooms);
  for (let b = 0; b < totalBedrooms; b++) {
    let targetFloor = 0;
    if (totalFloors > 1) {
      if (b === 0 && totalBedrooms >= 3) {
        targetFloor = 0;
      } else {
        targetFloor = ((b - (totalBedrooms >= 3 ? 1 : 0)) % (totalFloors - 1)) + 1;
      }
    }
    perFloor[targetFloor].push({
      id: `bedroom-${b + 1}`,
      name: b === 0 ? 'Master Bedroom' : `Bedroom ${b + 1}`,
      category: 'bedroom',
      targetArea: b === 0 ? 170 : 140,
      minArea: 95,
      priority: 9 - (b % 3),
    });
  }

  // Distribute bathrooms proportionally across floors that have bedrooms or living spaces
  const totalBaths = Math.max(1, floors.bathrooms);
  for (let bt = 0; bt < totalBaths; bt++) {
    const targetFloor = bt % totalFloors;
    perFloor[targetFloor].push({
      id: `bath-${bt + 1}`,
      name: additional.attachedBathrooms && bt > 0 ? `Attached Bath ${bt + 1}` : `Bath / WC ${bt + 1}`,
      category: 'bathroom',
      targetArea: 44,
      minArea: 26,
      priority: 4,
    });
  }

  // Ensure upper floors with extra capacity get a lounge or multi-purpose room if nearly empty
  for (let f = 1; f < totalFloors; f++) {
    if (perFloor[f].length === 0) {
      perFloor[f].push({
        id: `lounge-auto-${f}`,
        name: 'Upper Lounge',
        category: 'living',
        targetArea: 180,
        minArea: 100,
        priority: 6,
      });
    }
  }

  return perFloor;
}

export function generateFloorPlan(input: ProjectInput, variationSeed = 0): FloorPlanResult {
  const widthFt = Math.max(10, Number(input.plot.widthFt) || 30);
  const lengthFt = Math.max(10, Number(input.plot.lengthFt) || 50);
  const enteredArea = Math.max(100, Number(input.plot.areaSqFt) || widthFt * lengthFt);
  const areaComparison = comparePlotArea(enteredArea, lengthFt, widthFt);

  const totalFloors = getFloorCount(input.floors.floorConfig);
  const warnings: string[] = [];
  const recommendations: string[] = [];
  const vastuNotes: string[] = [];

  // Calculate perimeter setbacks based on plot dimensions and requirements
  const hasFrontParking = input.additional.carParking || input.additional.twoWheelerParking;
  const frontSetback = hasFrontParking
    ? Math.min(12, Math.max(8, roundHalf(lengthFt * 0.2)))
    : input.floors.garden
      ? Math.min(8, Math.max(4, roundHalf(lengthFt * 0.12)))
      : Math.min(4, roundHalf(lengthFt * 0.08));

  const rearSetback =
    lengthFt >= 34 && (input.additional.ventilation || input.additional.naturalLighting)
      ? Math.min(5, Math.max(2.5, roundHalf(lengthFt * 0.07)))
      : 0;

  const sideSetback =
    widthFt >= 28 && (input.additional.ventilation || input.plot.shape === 'Corner Plot')
      ? Math.min(3.5, Math.max(2, roundHalf(widthFt * 0.06)))
      : 0;

  const footprintX = sideSetback;
  const footprintY = rearSetback;
  const footprintWidth = Math.max(8, roundHalf(widthFt - sideSetback * 2));
  const footprintHeight = Math.max(10, roundHalf(lengthFt - frontSetback - rearSetback));

  const grossFootprintArea = Math.round(footprintWidth * footprintHeight);
  const singleFloorWallReserve = Math.round(grossFootprintArea * 0.12);
  const netBuildablePerFloor = Math.max(0, grossFootprintArea - singleFloorWallReserve);
  const totalNetBuildable = netBuildablePerFloor * totalFloors;

  const floorSpecs = buildFloorSpecs(input, totalFloors);
  const needStaircase = totalFloors > 1 || input.additional.staircase;
  const needLift = input.additional.lift;
  const circulationCoreAreaPerFloor = (needStaircase ? 58 : 0) + (needLift ? 28 : 0);

  const totalMinRequiredArea =
    floorSpecs.flat().reduce((sum, spec) => sum + spec.minArea, 0) +
    circulationCoreAreaPerFloor * totalFloors;

  let isValidFit = true;

  if (widthFt < 15 || lengthFt < 20) {
    isValidFit = false;
    warnings.push(
      `Plot dimensions (${widthFt} ft × ${lengthFt} ft) are below the 15 ft × 20 ft minimum envelope needed for standard residential rooms and wall clearances.`
    );
  }

  if (totalMinRequiredArea > totalNetBuildable) {
    isValidFit = false;
    const shortfall = Math.round(totalMinRequiredArea - totalNetBuildable);
    warnings.push(
      `Requested spaces require at least ~${totalMinRequiredArea.toLocaleString()} sq ft of net interior area, exceeding the ${totalNetBuildable.toLocaleString()} sq ft buildable capacity across ${totalFloors} floor(s) by ~${shortfall.toLocaleString()} sq ft.`
    );
    if (totalFloors < 4) {
      recommendations.push(
        `Upgrade floor configuration from ${input.floors.floorConfig} to ${
          totalFloors === 1 ? 'G+1' : totalFloors === 2 ? 'G+2' : 'G+3'
        } to double or expand vertical living area.`
      );
    }
    recommendations.push(
      'Reduce optional rooms (study, guest suite, store room) or reduce bedroom count to fit comfortably within setbacks.'
    );
  }

  // Check per-floor capacity too so Ground Floor isn't overloaded
  floorSpecs.forEach((specs, idx) => {
    const floorMin = specs.reduce((s, item) => s + item.minArea, 0) + circulationCoreAreaPerFloor;
    if (floorMin > netBuildablePerFloor * 1.08) {
      isValidFit = false;
      warnings.push(
        `${getFloorLabel(idx)} has ${specs.length} rooms requiring ~${floorMin} sq ft against ~${netBuildablePerFloor} sq ft available.`
      );
    }
  });

  if (!areaComparison.matchesClosely) {
    warnings.push(
      `Entered plot area (${areaComparison.enteredAreaSqFt} sq ft) differs from Length × Width (${areaComparison.calculatedAreaSqFt} sq ft) by ${areaComparison.differencePercent}%. The blueprint uses Length × Width dimensions.`
    );
  }

  // Consistent vertical core geometry across all floors
  const coreWidth = needStaircase ? Math.min(8, Math.max(6, roundHalf(footprintWidth * 0.24))) : 0;
  const coreHeight = needStaircase ? Math.min(12, Math.max(9, roundHalf(footprintHeight * 0.28))) : 0;
  const coreOnLeft = variationSeed % 2 === 0;
  const coreX = coreOnLeft ? footprintX : footprintX + footprintWidth - coreWidth;
  const coreY = footprintY + roundHalf((footprintHeight - coreHeight) * 0.45);

  const liftWidth = needLift ? Math.min(5, Math.max(4.5, coreWidth * 0.65)) : 0;
  const liftHeight = needLift ? 5 : 0;

  const layers: FloorPlanLayer[] = [];

  for (let f = 0; f < totalFloors; f++) {
    const specs = floorSpecs[f];
    const placedRooms: PlacedRoom[] = [];

    // Place vertical core (Staircase + Lift) at consistent XY
    if (needStaircase) {
      placedRooms.push({
        id: `staircase-f${f}`,
        name: 'Staircase Core',
        category: 'staircase',
        floorIndex: f,
        x: coreX,
        y: coreY,
        width: coreWidth,
        height: coreHeight,
        areaSqFt: Math.round(coreWidth * coreHeight),
        color: ROOM_PALETTE.staircase,
        doors: [],
        windows: [],
      });
    }

    if (needLift) {
      placedRooms.push({
        id: `lift-f${f}`,
        name: 'Lift Shaft',
        category: 'lift',
        floorIndex: f,
        x: coreX,
        y: Math.max(footprintY, coreY - liftHeight),
        width: liftWidth,
        height: liftHeight,
        areaSqFt: Math.round(liftWidth * liftHeight),
        color: ROOM_PALETTE.lift,
        doors: [],
        windows: [],
      });
    }

    // Partition remaining usable areas cleanly without overlapping the core:
    // Band 1: Rear zone above coreY (if > 4 ft)
    // Band 2: Side strip next to core
    // Band 3: Front zone below coreY + coreHeight
    const coreTop = needLift ? Math.max(footprintY, coreY - liftHeight) : coreY;
    const coreBottom = needStaircase ? coreY + coreHeight : footprintY;

    const regions: Rect[] = [];
    if (needStaircase) {
      const sideX = coreOnLeft ? footprintX + coreWidth : footprintX;
      const sideW = footprintWidth - coreWidth;

      if (coreTop - footprintY >= 6) {
        regions.push({ x: footprintX, y: footprintY, w: footprintWidth, h: coreTop - footprintY });
      }
      if (sideW >= 7) {
        regions.push({ x: sideX, y: coreTop, w: sideW, h: coreBottom - coreTop });
      }
      if (footprintY + footprintHeight - coreBottom >= 6) {
        regions.push({
          x: footprintX,
          y: coreBottom,
          w: footprintWidth,
          h: footprintY + footprintHeight - coreBottom,
        });
      }
    } else {
      regions.push({ x: footprintX, y: footprintY, w: footprintWidth, h: footprintHeight });
    }

    // Distribute floor specs across available non-overlapping regions by region area share
    const totalRegArea = regions.reduce((s, r) => s + r.w * r.h, 0);
    const regionBuckets: RoomSpec[][] = regions.map(() => []);
    const sortedSpecs = [...specs].sort((a, b) => b.priority - a.priority);

    // Assign Living/Kitchen/Dining to front-most region on Ground Floor when possible
    sortedSpecs.forEach((spec) => {
      let bestIdx = 0;
      let bestScore = -Infinity;
      regions.forEach((r, rIdx) => {
        const areaShare = (r.w * r.h) / Math.max(1, totalRegArea);
        const usedTarget = regionBuckets[rIdx].reduce((s, sp) => s + sp.targetArea, 0);
        const targetCap = areaShare * totalRegArea;
        let score = targetCap - usedTarget;
        // Prefer front region (highest y) for living & parking-adjacent on ground floor
        if (f === 0 && (spec.category === 'living' || spec.category === 'guest') && rIdx === regions.length - 1) {
          score += 65;
        }
        // Prefer rear/quiet region for master bedroom & pooja
        if ((spec.category === 'bedroom' || spec.category === 'pooja') && rIdx === 0) {
          score += 35;
        }
        if (score > bestScore) {
          bestScore = score;
          bestIdx = rIdx;
        }
      });
      regionBuckets[bestIdx].push(spec);
    });

    // If any region ended up empty, borrow from the fullest region with >= 2 rooms
    regionBuckets.forEach((bucket, rIdx) => {
      if (bucket.length === 0) {
        const donorIdx = regionBuckets.findIndex((b) => b.length >= 2);
        if (donorIdx >= 0) {
          bucket.push(regionBuckets[donorIdx].pop()!);
        } else if (regions[rIdx].w * regions[rIdx].h >= 40) {
          bucket.push({
            id: `corridor-${f}-${rIdx}`,
            name: f === 0 ? 'Foyer / Circulation' : 'Upper Lobby',
            category: 'corridor',
            targetArea: regions[rIdx].w * regions[rIdx].h,
            minArea: 30,
            priority: 1,
          });
        }
      }
    });

    regions.forEach((region, rIdx) => {
      const sliced = sliceRectIntoRooms(region, regionBuckets[rIdx], f, variationSeed + rIdx);
      placedRooms.push(...sliced);
    });

    // Exterior Zones on Ground Floor (Parking & Garden in front setback)
    if (f === 0) {
      if (input.additional.carParking && frontSetback >= 7) {
        const parkW = Math.min(11, Math.max(8.5, roundHalf(widthFt * 0.34)));
        placedRooms.push({
          id: 'parking-car',
          name: input.additional.twoWheelerParking ? 'Car & Bike Porch' : 'Car Parking Bay',
          category: 'parking',
          floorIndex: 0,
          x: footprintX,
          y: footprintY + footprintHeight,
          width: parkW,
          height: frontSetback,
          areaSqFt: Math.round(parkW * frontSetback),
          color: ROOM_PALETTE.parking,
          doors: [],
          windows: [],
          isExteriorZone: true,
        });
      } else if (input.additional.twoWheelerParking && frontSetback >= 4) {
        const bikeW = Math.min(8, roundHalf(widthFt * 0.25));
        placedRooms.push({
          id: 'parking-bike',
          name: 'Two-Wheeler Bay',
          category: 'parking',
          floorIndex: 0,
          x: footprintX,
          y: footprintY + footprintHeight,
          width: bikeW,
          height: frontSetback,
          areaSqFt: Math.round(bikeW * frontSetback),
          color: ROOM_PALETTE.parking,
          doors: [],
          windows: [],
          isExteriorZone: true,
        });
      }

      if (input.floors.garden && frontSetback >= 4) {
        const parkUsedW = placedRooms
          .filter((r) => r.category === 'parking')
          .reduce((s, r) => s + r.width, 0);
        const gardenW = Math.max(6, roundHalf(widthFt - sideSetback * 2 - parkUsedW));
        if (gardenW >= 5) {
          placedRooms.push({
            id: 'garden-front',
            name: 'Front Courtyard Garden',
            category: 'garden',
            floorIndex: 0,
            x: footprintX + parkUsedW,
            y: footprintY + footprintHeight,
            width: gardenW,
            height: frontSetback,
            areaSqFt: Math.round(gardenW * frontSetback),
            color: ROOM_PALETTE.garden,
            doors: [],
            windows: [],
            isExteriorZone: true,
          });
        }
      }
    }

    // Upper floor balcony overhang in front setback zone
    if (f > 0 && input.floors.balcony && frontSetback >= 4) {
      const balDepth = Math.min(5, frontSetback * 0.7);
      const balW = Math.max(8, roundHalf(footprintWidth * 0.55));
      placedRooms.push({
        id: `balcony-f${f}`,
        name: 'Front Balcony',
        category: 'balcony',
        floorIndex: f,
        x: footprintX + roundHalf((footprintWidth - balW) * 0.5),
        y: footprintY + footprintHeight,
        width: balW,
        height: balDepth,
        areaSqFt: Math.round(balW * balDepth),
        color: ROOM_PALETTE.balcony,
        doors: [],
        windows: [],
        isExteriorZone: true,
      });
    }

    // Top floor open sit-out terrace if selected
    if (f === totalFloors - 1 && input.floors.terrace && f > 0 && frontSetback >= 5) {
      const terW = Math.max(6, roundHalf(footprintWidth * 0.3));
      placedRooms.push({
        id: `terrace-f${f}`,
        name: 'Open Terrace Deck',
        category: 'terrace',
        floorIndex: f,
        x: footprintX,
        y: footprintY + footprintHeight,
        width: terW,
        height: Math.min(6, frontSetback * 0.75),
        areaSqFt: Math.round(terW * Math.min(6, frontSetback * 0.75)),
        color: ROOM_PALETTE.terrace,
        doors: [],
        windows: [],
        isExteriorZone: true,
      });
    }

    const withOpenings = attachDoorsAndWindows(
      placedRooms,
      { x: footprintX, y: footprintY, w: footprintWidth, h: footprintHeight },
      f,
      input.additional.naturalLighting
    );

    layers.push({
      floorIndex: f,
      floorLabel: getFloorLabel(f),
      footprintX,
      footprintY,
      footprintWidth,
      footprintHeight,
      builtUpAreaSqFt: grossFootprintArea,
      rooms: withOpenings,
    });
  }

  if (input.additional.vastuPreferred) {
    vastuNotes.push(
      `Main entrance aligned to ${input.plot.facing} road frontage with morning light priority.`,
      'Pooja & quiet sanctuaries zoned away from utility and sanitary cores.',
      'Cross-ventilation setbacks reserved along perimeter facades.'
    );
  }

  if (input.additional.futureExpansion) {
    recommendations.push(
      'Structural column grid aligned with the staircase core to support future vertical floor addition.'
    );
  }

  const totalBuiltUpAreaSqFt = grossFootprintArea * totalFloors;
  const wallAndCirculationReserveSqFt = singleFloorWallReserve * totalFloors;
  const carpetAreaSqFt = Math.max(0, totalBuiltUpAreaSqFt - wallAndCirculationReserveSqFt);

  return {
    seed: variationSeed,
    plotLengthFt: lengthFt,
    plotWidthFt: widthFt,
    plotAreaSqFt: Math.round(lengthFt * widthFt),
    areaComparison,
    totalFloors,
    totalBuiltUpAreaSqFt,
    carpetAreaSqFt,
    wallAndCirculationReserveSqFt,
    footprintX,
    footprintY,
    footprintWidth,
    footprintHeight,
    facing: input.plot.facing,
    compassRotationDeg: getCompassRotationForFacing(input.plot.facing),
    floors: layers,
    warnings,
    recommendations,
    isValidFit,
    vastuNotes,
  };
}

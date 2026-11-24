export type PlotShape = 'Rectangle' | 'Square' | 'Corner Plot' | 'Irregular';
export type Direction = 'North' | 'South' | 'East' | 'West' | 'North-East' | 'North-West' | 'South-East' | 'South-West';
export type RoadSide = 'Front' | 'Front & Right' | 'Front & Left' | 'Two Opposite Sides';
export type FloorLevelOption = 'Ground Floor' | 'G+1' | 'G+2' | 'G+3';
export type KitchenStyle = 'open' | 'closed';
export type DesignStyle =
  | 'Modern Indian'
  | 'Contemporary'
  | 'Traditional Indian'
  | 'Minimalist'
  | 'Luxury Villa'
  | 'Scandinavian';
export type BudgetTier = 'Low' | 'Medium' | 'Premium' | 'Custom';

export interface PlotDetails {
  areaSqFt: number;
  lengthFt: number;
  widthFt: number;
  shape: PlotShape;
  facing: Direction;
  roadSide: RoadSide;
  roadWidthFt: number;
  city: string;
  state: string;
}

export interface FloorRequirements {
  floorConfig: FloorLevelOption;
  bedrooms: number;
  bathrooms: number;
  kitchens: number;
  livingRooms: number;
  diningRoom: boolean;
  poojaRoom: boolean;
  studyRoom: boolean;
  guestRoom: boolean;
  storeRoom: boolean;
  balcony: boolean;
  garden: boolean;
  terrace: boolean;
}

export interface AdditionalRequirements {
  carParking: boolean;
  twoWheelerParking: boolean;
  lift: boolean;
  staircase: boolean;
  kitchenType: KitchenStyle;
  attachedBathrooms: boolean;
  vastuPreferred: boolean;
  naturalLighting: boolean;
  ventilation: boolean;
  privacy: boolean;
  futureExpansion: boolean;
}

export interface DesignPreferences {
  style: DesignStyle;
  budgetTier: BudgetTier;
  customBudgetLakhs: number;
  description: string;
}

export interface ProjectInput {
  projectName: string;
  plot: PlotDetails;
  floors: FloorRequirements;
  additional: AdditionalRequirements;
  design: DesignPreferences;
}

export type RoomCategory =
  | 'living'
  | 'bedroom'
  | 'bathroom'
  | 'kitchen'
  | 'dining'
  | 'pooja'
  | 'study'
  | 'guest'
  | 'store'
  | 'staircase'
  | 'lift'
  | 'parking'
  | 'corridor'
  | 'balcony'
  | 'garden'
  | 'terrace';

export interface DoorPlacement {
  id: string;
  x: number; // feet from plot left
  y: number; // feet from plot top (front or rear mapped cleanly)
  wall: 'top' | 'bottom' | 'left' | 'right';
  widthFt: number;
  swing: 'in' | 'out';
}

export interface WindowPlacement {
  id: string;
  x: number;
  y: number;
  wall: 'top' | 'bottom' | 'left' | 'right';
  widthFt: number;
}

export interface PlacedRoom {
  id: string;
  name: string;
  category: RoomCategory;
  floorIndex: number;
  x: number; // feet from buildable origin or plot origin
  y: number;
  width: number;
  height: number;
  areaSqFt: number;
  color: string;
  doors: DoorPlacement[];
  windows: WindowPlacement[];
  isExteriorZone?: boolean;
}

export interface FloorPlanLayer {
  floorIndex: number;
  floorLabel: string;
  footprintX: number;
  footprintY: number;
  footprintWidth: number;
  footprintHeight: number;
  builtUpAreaSqFt: number;
  rooms: PlacedRoom[];
}

export interface PlotAreaComparison {
  enteredAreaSqFt: number;
  calculatedAreaSqFt: number;
  differenceSqFt: number;
  differencePercent: number;
  matchesClosely: boolean;
}

export interface FloorPlanResult {
  seed: number;
  plotLengthFt: number;
  plotWidthFt: number;
  plotAreaSqFt: number;
  areaComparison: PlotAreaComparison;
  totalFloors: number;
  totalBuiltUpAreaSqFt: number;
  carpetAreaSqFt: number;
  wallAndCirculationReserveSqFt: number;
  footprintX: number;
  footprintY: number;
  footprintWidth: number;
  footprintHeight: number;
  facing: Direction;
  compassRotationDeg: number;
  floors: FloorPlanLayer[];
  warnings: string[];
  recommendations: string[];
  isValidFit: boolean;
  vastuNotes: string[];
}

export type ConstructionQuality = 'Low' | 'Medium' | 'Premium';
export type LocationTier = 'Metro / Tier 1' | 'Tier 2 City' | 'Tier 3 / Town';
export type MaterialQuality = 'Standard' | 'Branded' | 'Luxury';

export interface BudgetInputs {
  builtUpAreaSqFt: number;
  floorsCount: number;
  quality: ConstructionQuality;
  locationTier: LocationTier;
  materialQuality: MaterialQuality;
  customRatePerSqFt: number;
}

export interface BudgetBreakdownItem {
  id: string;
  label: string;
  percentage: number;
  amount: number;
  color: string;
  notes: string;
}

export interface BudgetResult {
  totalEstimatedCost: number;
  effectiveRatePerSqFt: number;
  builtUpAreaSqFt: number;
  breakdown: BudgetBreakdownItem[];
  disclaimer: string;
}

export interface SavedProject {
  id: string;
  savedAt: string;
  input: ProjectInput;
  seed: number;
  totalBuiltUpAreaSqFt: number;
  estimatedCost: number;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  submittedAt: string;
}

export type AppSection = 'home' | 'design' | 'about' | 'contact';

// Core domain types for the CARBYN personalized fueling platform

export type SportType =
  | "marathon"
  | "ironman"
  | "triathlon"
  | "cycling"
  | "ultra"
  | "trail"
  | "other";

export type Goal = "race" | "training" | "both";

export type Tolerance = "none" | "low" | "medium" | "high";

export type YesNo = "yes" | "no";

export interface AssessmentAnswers {
  // Contact
  name: string;
  email: string;
  phone: string;

  // Profile
  sportType: SportType;
  goal: Goal;
  trainingHoursPerWeek: number;
  eventName: string;
  eventDate: string; // ISO date

  // Physiology & tolerances
  caffeineTolerance: Tolerance;
  caffeineConsumption: "none" | "occasional" | "daily" | "heavy";
  sweatRate: "low" | "medium" | "high";
  hotClimateTraining: YesNo;
  sodiumIssues: YesNo;
  digestiveIssues: YesNo;
  fructoseTolerance: "low" | "normal" | "high";
  sugarSensitivity: YesNo;
  diabetes: YesNo;
  preferredSweetness: "light" | "regular" | "intense";

  // Preferences
  flavorPreferences: string[];
  currentNutritionStrategy: string;
  nutritionStrategyItems: string[];
  nutritionStrategyNotes: string;
  caffeineGoal: CaffeineGoal;
  carbTargetPerHour: number; // g/hour the athlete believes they need
  pastIssuesWithGels: YesNo;
  pastIssuesWithSportsDrinks: YesNo;
}

export type FlavorStrength = "lite" | "regular" | "mega";
export type MaltoFructoseRatio = "1:0.8" | "2:1";

export interface FormulaRecommendation {
  flavor: string;
  flavorStrength: FlavorStrength;
  carbsPerServing: 25 | 50 | 75 | 100 | 125 | 150;
  sodiumPerServing: 200 | 400 | 600 | 800 | 1000;
  ratio: MaltoFructoseRatio;
  caffeinePerServing: 0 | 25 | 50 | 75 | 100;
  preservatives: YesNo;
  scooper: YesNo;
  reasoning: ReasoningEntry[];
}

export interface ReasoningEntry {
  field: "carbs" | "sodium" | "caffeine" | "ratio" | "flavor" | "sweetness";
  explanation: { en: string; es: string };
}

export interface PackRecommendation {
  servings: number;
  label: { en: string; es: string };
  reasoning: { en: string; es: string };
  bundleRaceFormula: boolean;
}

export interface CustomMix extends FormulaRecommendation {
  id?: string;
  athleteName: string;
  packageLabel: string;
  motivationalMessage: { en: string; es: string };
  warnings: ReasoningEntry["field"][];
}

export type CaffeineGoal = "training_only" | "race_only" | "both";

export interface DualMix {
  training: FormulaRecommendation;
  race: FormulaRecommendation;
  reasoning: { en: string; es: string };
}

export interface ScoopWeek {
  week: number;
  scoops: number;
  label: string;
}

export interface RaceDayFuelingPlan {
  preRace: { carbs: number; description: { en: string; es: string } };
  bike?: { carbsPerHour: number; description: { en: string; es: string } };
  run?: { carbsPerHour: number; description: { en: string; es: string } };
  recovery: { carbs: number; description: { en: string; es: string } };
}

// --- Addendum types ---

export interface QuantityExtras {
  raceGoalHours: number;
  raceGoalHasTarget: boolean;
  fueledDisciplines: string[];
}

export interface RaceDayAnswers {
  carbsPerHourRace: number;
  raceClimate: "temperate" | "hot_humid" | "hot_dry" | "cold";
  swimMinutes: number;
  bikeMinutes: number;
  runMinutes: number;
  hasAidStations: "yes" | "no";
}

export interface RaceNutritionPlan {
  segments: RaceSegment[];
  totalCarbs: number;
  totalServings: number;
  generatedAt: string;
}

export interface RaceSegment {
  label: { en: string; es: string };
  durationMinutes: number;
  carbsTotal: number;
  servings: number;
  includeCaffeine: boolean;
  notes: { en: string; es: string };
}

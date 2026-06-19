import { freshDefaultLogbook } from '@/data/logbook-defaults';
import type { LogbookDocument, Trip } from '@/types/logbook';

const arrayKeys = [
  'species',
  'methods',
  'lureTypes',
  'flasherTypes',
  'waterClarities',
  'weatherTypes',
  'reelStyles',
  'rodTypes',
  'lineTypes',
  'trollingPresentations',
  'trollingDirections',
  'setupLineSides',
  'lures',
  'flashers',
  'reels',
  'rods',
  'rodReelCombos',
  'people',
  'locations',
  'trips',
] as const;

function normalizeTrip(trip: Partial<Trip>): Trip {
  const normalized = {
    id: '',
    title: '',
    date: '',
    location: '',
    locationId: '',
    launch: '',
    launchId: '',
    startTime: '',
    endTime: '',
    hours: 0,
    targetSpecies: '',
    method: '',
    intent: '',
    tripRating: '',
    waterTemp: '',
    waterClarity: '',
    weather: '',
    waveHeight: '',
    waveChop: '',
    wind: '',
    structure: '',
    notes: '',
    notePhotos: [],
    people: [],
    gearUsed: [],
    catches: [],
    lostFish: [],
    ...trip,
  };
  normalized.notePhotos = Array.isArray(trip.notePhotos) ? trip.notePhotos : [];
  normalized.people = Array.isArray(trip.people) ? trip.people : [];
  normalized.gearUsed = Array.isArray(trip.gearUsed) ? trip.gearUsed : [];
  normalized.catches = Array.isArray(trip.catches) ? trip.catches : [];
  normalized.lostFish = Array.isArray(trip.lostFish) ? trip.lostFish : [];
  return normalized;
}

export function normalizeLogbook(value: unknown): LogbookDocument {
  const defaults = freshDefaultLogbook();
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return defaults;
  }

  const source = value as Partial<LogbookDocument>;
  const normalized = {
    ...defaults,
    ...source,
    settings: {
      ...defaults.settings,
      ...(source.settings ?? {}),
      units: {
        ...defaults.settings.units,
        ...(source.settings?.units ?? {}),
      },
      chopRanges: Array.isArray(source.settings?.chopRanges)
        ? source.settings.chopRanges
        : defaults.settings.chopRanges,
    },
  } as LogbookDocument;

  for (const key of arrayKeys) {
    if (!Array.isArray(source[key])) {
      normalized[key] = defaults[key] as never;
    }
  }

  normalized.reels = normalized.reels.map((reel) => ({
    ...reel,
    lineHistory: Array.isArray(reel.lineHistory) ? reel.lineHistory : [],
  }));
  normalized.locations = normalized.locations.map((location) => ({
    ...location,
    launches: Array.isArray(location.launches) ? location.launches : [],
  }));
  normalized.trips = normalized.trips.map(normalizeTrip);

  return normalized;
}

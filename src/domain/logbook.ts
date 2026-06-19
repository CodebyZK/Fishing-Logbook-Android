import type {
  CatchRecord,
  FishContext,
  LostFishRecord,
  SetupLine,
  StartTripInput,
  Trip,
} from '@/types/logbook';

export function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function localDate(now = new Date()) {
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

export function localTime(now = new Date()) {
  return now.toLocaleTimeString('en-CA', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function calculateHours(startTime: string, endTime: string) {
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  if (![startHour, startMinute, endHour, endMinute].every(Number.isFinite)) {
    return 0;
  }
  let minutes = endHour * 60 + endMinute - (startHour * 60 + startMinute);
  if (minutes < 0) {
    minutes += 24 * 60;
  }
  return Math.round((minutes / 60) * 100) / 100;
}

function emptyFishContext(now = new Date()): FishContext {
  return {
    id: '',
    personId: '',
    time: localTime(now),
    waterDepth: '',
    depthDown: '',
    presentation: '',
    direction: '',
    fowCaught: '',
    speed: '',
    retrieve: '',
    ballDepth: '',
    lineBehindBoard: '',
    estimatedLureDepth: '',
    dipseySetting: '',
    lineOut: '',
    estimatedDepth: '',
    notes: '',
    setupLineId: '',
    lureId: '',
    flasherId: '',
  };
}

export function createCatch(): CatchRecord {
  return {
    ...emptyFishContext(),
    id: createId('catch'),
    species: '',
    released: true,
    length: '',
    weight: '',
    manualCoordinates: null,
    coordinates: null,
    photos: [],
  };
}

export function createLostFish(): LostFishRecord {
  return {
    ...emptyFishContext(),
    id: createId('lost'),
    possibleSpecies: '',
    released: false,
  };
}

export function createSetupLine(): SetupLine {
  return {
    id: createId('setup'),
    personId: '',
    startTime: localTime(),
    endTime: '',
    changeNote: '',
    side: '',
    lineLabel: '',
    comboId: '',
    rodId: '',
    reelId: '',
    lureId: '',
    flasherId: '',
    presentation: '',
    deepestRigger: false,
    lureMinutes: 0,
    flasherMinutes: 0,
  };
}

export function createTrip(input?: Partial<StartTripInput>): Trip {
  return {
    id: createId('trip'),
    title: input?.title ?? '',
    date: localDate(),
    location: input?.location ?? '',
    locationId: '',
    launch: '',
    launchId: '',
    startTime: localTime(),
    endTime: '',
    hours: 0,
    targetSpecies: input?.targetSpecies ?? '',
    method: input?.method ?? 'Trolling',
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
  };
}

export function finalizeTrip(trip: Trip): Trip {
  return {
    ...trip,
    hours: calculateHours(trip.startTime, trip.endTime),
  };
}

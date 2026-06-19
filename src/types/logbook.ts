export type Id = string;

export type ChoiceOption = {
  value: string;
  label: string;
};

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type MediaReference = {
  id?: Id;
  name?: string;
  caption?: string;
  filename?: string;
  path?: string;
  url?: string;
  image?: string;
  mediaType?: string;
  mimeType?: string;
  previewFilename?: string;
  previewPath?: string;
  previewUrl?: string;
  coordinates?: Coordinates | null;
  captureTime?: string;
  [key: string]: unknown;
};

export type Person = {
  id: Id;
  name: string;
};

export type Launch = {
  id: Id;
  name: string;
  coordinates?: Coordinates | null;
};

export type FishingLocation = {
  id: Id;
  name: string;
  coordinates?: Coordinates | null;
  launches: Launch[];
};

export type Lure = {
  id: Id;
  name: string;
  type: string;
  brand: string;
  color: string;
  notes: string;
  image?: string;
  [key: string]: unknown;
};

export type Flasher = Lure;

export type LineHistory = {
  id: Id;
  spooledDate: string;
  discardedDate: string;
  type: string;
  brand: string;
  name: string;
  weight: string;
  diameterIn: string;
  diameterMm: string;
  color: string;
  monoBacking: string;
  notes: string;
};

export type Reel = {
  id: Id;
  shortName: string;
  style: string;
  brand: string;
  name: string;
  size: string;
  weight: string;
  gearRatio: string;
  retrieveRate: string;
  maxDrag: string;
  monoCapacity: string;
  braidCapacity: string;
  purchaseAmount: string;
  dateBought: string;
  notes: string;
  lineHistory: LineHistory[];
  [key: string]: unknown;
};

export type Rod = {
  id: Id;
  shortName: string;
  type: string;
  brand: string;
  name: string;
  length: string;
  power: string;
  action: string;
  lureRating: string;
  purchaseAmount: string;
  dateBought: string;
  notes: string;
  [key: string]: unknown;
};

export type RodReelCombo = {
  id: Id;
  shortName: string;
  rodId: Id | '';
  reelId: Id | '';
  notes: string;
};

export type SetupLine = {
  id: Id;
  personId: Id | '';
  startTime: string;
  endTime: string;
  changeNote: string;
  side: string;
  lineLabel: string;
  comboId: Id | '';
  rodId: Id | '';
  reelId: Id | '';
  lureId: Id | '';
  flasherId: Id | '';
  presentation: string;
  deepestRigger: boolean;
  lureMinutes: number;
  flasherMinutes: number;
  [key: string]: unknown;
};

export type FishContext = {
  id: Id;
  personId: Id | '';
  time: string;
  waterDepth: string;
  depthDown: string;
  presentation: string;
  direction: string;
  fowCaught: string;
  speed: string;
  retrieve: string;
  ballDepth: string;
  lineBehindBoard: string;
  estimatedLureDepth: string;
  dipseySetting: string;
  lineOut: string;
  estimatedDepth: string;
  notes: string;
  setupLineId: Id | '';
  lureId: Id | '';
  flasherId: Id | '';
  [key: string]: unknown;
};

export type CatchRecord = FishContext & {
  species: string;
  released: boolean;
  length: string;
  weight: string;
  manualCoordinates: Coordinates | null;
  coordinates: Coordinates | null;
  photos: MediaReference[];
  weatherData?: Record<string, unknown> | null;
};

export type LostFishRecord = FishContext & {
  possibleSpecies: string;
  released: false;
};

export type Trip = {
  id: Id;
  title: string;
  date: string;
  location: string;
  locationId: Id | '';
  launch: string;
  launchId: Id | '';
  startTime: string;
  endTime: string;
  hours: number;
  targetSpecies: string;
  method: string;
  intent: string;
  tripRating: string;
  waterTemp: string;
  waterClarity: string;
  weather: string;
  waveHeight: string;
  waveChop: string;
  wind: string;
  structure: string;
  notes: string;
  notePhotos: MediaReference[];
  people: Person[];
  gearUsed: SetupLine[];
  catches: CatchRecord[];
  lostFish: LostFishRecord[];
  weatherData?: Record<string, unknown> | null;
  [key: string]: unknown;
};

export type UnitSettings = {
  depth: string;
  distance: string;
  speed: string;
  windSpeed: string;
  pressure: string;
  airTemperature: string;
  waterTemperature: string;
  precipitation: string;
  waveHeight: string;
  fishLength: string;
  fishWeight: string;
};

export type ChopRange = {
  id: Id;
  label: string;
  maxFeet: number | null;
};

export type LogbookSettings = {
  timeFormat: '12' | '24';
  units: UnitSettings;
  chopRanges: ChopRange[];
};

export type LogbookDocument = {
  species: string[];
  methods: string[];
  lureTypes: string[];
  flasherTypes: string[];
  waterClarities: string[];
  weatherTypes: string[];
  reelStyles: string[];
  rodTypes: string[];
  lineTypes: string[];
  trollingPresentations: ChoiceOption[];
  trollingDirections: string[];
  setupLineSides: ChoiceOption[];
  lures: Lure[];
  flashers: Flasher[];
  reels: Reel[];
  rods: Rod[];
  rodReelCombos: RodReelCombo[];
  settings: LogbookSettings;
  people: Person[];
  locations: FishingLocation[];
  trips: Trip[];
  [key: string]: unknown;
};

export type AppState = {
  schemaVersion: 2;
  logbook: LogbookDocument;
  activeTripId?: Id;
  serverUrl: string;
  dirty: boolean;
  lastSyncAt?: string;
  syncError?: string;
};

export type StartTripInput = Pick<Trip, 'title' | 'location' | 'targetSpecies' | 'method'>;

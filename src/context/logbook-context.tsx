import { createContext, useContext, useEffect, useReducer, useState } from 'react';

import { finalizeTrip } from '@/domain/logbook';
import { fetchLogbook, replaceLogbook } from '@/services/logbook-api';
import { emptyAppState, loadLogbook, saveLogbook } from '@/storage/logbook-storage';
import type {
  AppState,
  FishingLocation,
  LogbookDocument,
  Person,
  Trip,
} from '@/types/logbook';

type Action =
  | { type: 'load'; state: AppState }
  | { type: 'saveTrip'; trip: Trip; makeActive: boolean }
  | { type: 'deleteTrip'; tripId: string }
  | { type: 'endActiveTrip'; endTime: string }
  | { type: 'replaceLogbook'; logbook: LogbookDocument; syncedAt: string }
  | { type: 'updateLogbook'; logbook: LogbookDocument }
  | { type: 'setServerUrl'; serverUrl: string }
  | { type: 'syncSuccess'; syncedAt: string }
  | { type: 'syncError'; message: string };

type LogbookContextValue = {
  state: AppState;
  logbook: LogbookDocument;
  activeTrip: Trip | undefined;
  isLoading: boolean;
  isSyncing: boolean;
  storageError?: string;
  saveTrip: (trip: Trip, makeActive?: boolean) => void;
  deleteTrip: (tripId: string) => void;
  endActiveTrip: (endTime: string) => void;
  updateLogbook: (logbook: LogbookDocument) => void;
  setServerUrl: (serverUrl: string) => void;
  downloadFromServer: () => Promise<void>;
  uploadToServer: () => Promise<void>;
};

const LogbookContext = createContext<LogbookContextValue | null>(null);

function mergeById<T extends { id: string }>(items: T[], additions: T[]) {
  const merged = new Map(items.map((item) => [item.id, item]));
  for (const item of additions) {
    if (item.id) {
      merged.set(item.id, item);
    }
  }
  return [...merged.values()];
}

function mergeLocation(logbook: LogbookDocument, trip: Trip) {
  if (!trip.location.trim()) {
    return { locations: logbook.locations, trip };
  }

  const existing = logbook.locations.find(
    (location) =>
      location.id === trip.locationId ||
      location.name.toLowerCase() === trip.location.trim().toLowerCase(),
  );
  if (existing) {
    return {
      locations: logbook.locations,
      trip: { ...trip, location: existing.name, locationId: existing.id },
    };
  }

  const location: FishingLocation = {
    id: trip.locationId || `loc-${trip.id}`,
    name: trip.location.trim(),
    coordinates: null,
    launches: [],
  };
  return {
    locations: [...logbook.locations, location],
    trip: { ...trip, locationId: location.id },
  };
}

function saveTrip(state: AppState, rawTrip: Trip, makeActive: boolean): AppState {
  const locationResult = mergeLocation(state.logbook, finalizeTrip(rawTrip));
  const trip = locationResult.trip;
  const exists = state.logbook.trips.some((item) => item.id === trip.id);
  const trips = exists
    ? state.logbook.trips.map((item) => (item.id === trip.id ? trip : item))
    : [trip, ...state.logbook.trips];
  const people: Person[] = mergeById(state.logbook.people, trip.people);
  const species = [...state.logbook.species];
  for (const value of [
    trip.targetSpecies,
    ...trip.catches.map((item) => item.species),
    ...trip.lostFish.map((item) => item.possibleSpecies),
  ]) {
    if (value && !species.some((item) => item.toLowerCase() === value.toLowerCase())) {
      species.push(value);
    }
  }

  return {
    ...state,
    activeTripId: makeActive ? trip.id : state.activeTripId === trip.id ? undefined : state.activeTripId,
    dirty: true,
    syncError: undefined,
    logbook: {
      ...state.logbook,
      species,
      methods: state.logbook.methods.includes(trip.method)
        ? state.logbook.methods
        : [...state.logbook.methods, trip.method],
      people,
      locations: locationResult.locations,
      trips,
    },
  };
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'load':
      return action.state;
    case 'saveTrip':
      return saveTrip(state, action.trip, action.makeActive);
    case 'deleteTrip':
      return {
        ...state,
        activeTripId: state.activeTripId === action.tripId ? undefined : state.activeTripId,
        dirty: true,
        syncError: undefined,
        logbook: {
          ...state.logbook,
          trips: state.logbook.trips.filter((trip) => trip.id !== action.tripId),
        },
      };
    case 'endActiveTrip':
      if (!state.activeTripId) {
        return state;
      }
      return {
        ...state,
        activeTripId: undefined,
        dirty: true,
        syncError: undefined,
        logbook: {
          ...state.logbook,
          trips: state.logbook.trips.map((trip) =>
            trip.id === state.activeTripId
              ? finalizeTrip({ ...trip, endTime: action.endTime })
              : trip,
          ),
        },
      };
    case 'replaceLogbook':
      return {
        ...state,
        logbook: action.logbook,
        activeTripId: undefined,
        dirty: false,
        lastSyncAt: action.syncedAt,
        syncError: undefined,
      };
    case 'updateLogbook':
      return {
        ...state,
        logbook: action.logbook,
        dirty: true,
        syncError: undefined,
      };
    case 'setServerUrl':
      return { ...state, serverUrl: action.serverUrl, syncError: undefined };
    case 'syncSuccess':
      return {
        ...state,
        dirty: false,
        lastSyncAt: action.syncedAt,
        syncError: undefined,
      };
    case 'syncError':
      return { ...state, syncError: action.message };
  }
}

export function LogbookProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, emptyAppState);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [storageError, setStorageError] = useState<string>();

  useEffect(() => {
    loadLogbook()
      .then((savedState) => dispatch({ type: 'load', state: savedState }))
      .catch(() => setStorageError('Saved data could not be loaded on this device.'))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (isLoading) {
      return;
    }
    saveLogbook(state).catch(() => setStorageError('Changes could not be saved locally.'));
  }, [isLoading, state]);

  const activeTrip = state.logbook.trips.find((trip) => trip.id === state.activeTripId);

  const downloadFromServer = async () => {
    setIsSyncing(true);
    try {
      const logbook = await fetchLogbook(state.serverUrl);
      dispatch({ type: 'replaceLogbook', logbook, syncedAt: new Date().toISOString() });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Download failed.';
      dispatch({ type: 'syncError', message });
      throw error;
    } finally {
      setIsSyncing(false);
    }
  };

  const uploadToServer = async () => {
    setIsSyncing(true);
    try {
      await replaceLogbook(state.serverUrl, state.logbook);
      dispatch({ type: 'syncSuccess', syncedAt: new Date().toISOString() });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Upload failed.';
      dispatch({ type: 'syncError', message });
      throw error;
    } finally {
      setIsSyncing(false);
    }
  };

  const value: LogbookContextValue = {
    state,
    logbook: state.logbook,
    activeTrip,
    isLoading,
    isSyncing,
    storageError,
    saveTrip: (trip, makeActive = false) => dispatch({ type: 'saveTrip', trip, makeActive }),
    deleteTrip: (tripId) => dispatch({ type: 'deleteTrip', tripId }),
    endActiveTrip: (endTime) => dispatch({ type: 'endActiveTrip', endTime }),
    updateLogbook: (logbook) => dispatch({ type: 'updateLogbook', logbook }),
    setServerUrl: (serverUrl) => dispatch({ type: 'setServerUrl', serverUrl }),
    downloadFromServer,
    uploadToServer,
  };

  return <LogbookContext.Provider value={value}>{children}</LogbookContext.Provider>;
}

export function useLogbook() {
  const context = useContext(LogbookContext);
  if (!context) {
    throw new Error('useLogbook must be used inside LogbookProvider');
  }
  return context;
}

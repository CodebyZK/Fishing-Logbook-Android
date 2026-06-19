import AsyncStorage from '@react-native-async-storage/async-storage';

import { freshDefaultLogbook } from '@/data/logbook-defaults';
import { normalizeLogbook } from '@/data/normalize-logbook';
import type { AppState, LogbookDocument } from '@/types/logbook';

const STORAGE_KEY = 'fishing-logbook:v2';
const LEGACY_STORAGE_KEY = 'fishing-logbook:v1';
const CORRUPT_STORAGE_KEY = 'fishing-logbook:recovery';

export const emptyAppState: AppState = {
  schemaVersion: 2,
  logbook: freshDefaultLogbook(),
  serverUrl: '',
  dirty: false,
};

function migrateLegacyState(value: unknown): AppState {
  if (!value || typeof value !== 'object') {
    return emptyAppState;
  }

  const source = value as {
    logbook?: unknown;
    trips?: LogbookDocument['trips'];
    activeTripId?: string;
    serverUrl?: string;
    dirty?: boolean;
    lastSyncAt?: string;
    syncError?: string;
  };

  return {
    schemaVersion: 2,
    logbook: normalizeLogbook(source.logbook ?? { trips: source.trips }),
    activeTripId: source.activeTripId,
    serverUrl: source.serverUrl ?? '',
    dirty: source.dirty ?? Boolean(source.trips),
    lastSyncAt: source.lastSyncAt,
    syncError: source.syncError,
  };
}

export async function loadLogbook(): Promise<AppState> {
  const currentValue = await AsyncStorage.getItem(STORAGE_KEY);
  if (currentValue) {
    try {
      return migrateLegacyState(JSON.parse(currentValue));
    } catch {
      await AsyncStorage.setItem(CORRUPT_STORAGE_KEY, currentValue);
      await AsyncStorage.removeItem(STORAGE_KEY);
      return emptyAppState;
    }
  }

  const legacyValue = await AsyncStorage.getItem(LEGACY_STORAGE_KEY);
  if (legacyValue) {
    try {
      return migrateLegacyState(JSON.parse(legacyValue));
    } catch {
      await AsyncStorage.setItem(CORRUPT_STORAGE_KEY, legacyValue);
      await AsyncStorage.removeItem(LEGACY_STORAGE_KEY);
      return emptyAppState;
    }
  }

  return emptyAppState;
}

export async function saveLogbook(state: AppState) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

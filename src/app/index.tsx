import * as Network from 'expo-network';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GearScreen } from '@/components/gear-screen';
import { SettingsScreen } from '@/components/settings-screen';
import { TripEditorModal } from '@/components/trip-editor-modal';
import { useLogbook } from '@/context/logbook-context';
import { localTime } from '@/domain/logbook';
import type { Trip } from '@/types/logbook';
import { colors } from '@/ui/theme';

type Tab = 'trips' | 'stats' | 'map' | 'gear' | 'gallery' | 'settings';

export default function LogbookScreen() {
  const {
    state,
    logbook,
    activeTrip,
    isLoading,
    isSyncing,
    storageError,
    saveTrip,
    deleteTrip,
    endActiveTrip,
    updateLogbook,
    setServerUrl,
    downloadFromServer,
    uploadToServer,
  } = useLogbook();
  const [tab, setTab] = useState<Tab>('trips');
  const [editingTripId, setEditingTripId] = useState<string | null>();
  const [summaryTripId, setSummaryTripId] = useState<string>();
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    Network.getNetworkStateAsync().then((network) => setIsOnline(network.isConnected !== false));
    const subscription = Network.addNetworkStateListener((network) => {
      setIsOnline(network.isConnected !== false);
    });
    return () => subscription.remove();
  }, []);

  const editingTrip =
    editingTripId === null
      ? undefined
      : logbook.trips.find((trip) => trip.id === editingTripId);
  const summaryTrip = logbook.trips.find((trip) => trip.id === summaryTripId);
  const totals = useMemo(
    () => ({
      trips: logbook.trips.length,
      landed: logbook.trips.reduce((sum, trip) => sum + trip.catches.length, 0),
      lost: logbook.trips.reduce((sum, trip) => sum + trip.lostFish.length, 0),
      hours: logbook.trips.reduce((sum, trip) => sum + (Number(trip.hours) || 0), 0),
    }),
    [logbook.trips],
  );

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.green} size="large" />
        <Text style={styles.muted}>Opening your logbook…</Text>
      </View>
    );
  }

  const syncLabel = !isOnline
    ? 'Offline'
    : state.syncError
      ? 'Sync error'
      : state.dirty
        ? 'Local changes'
        : state.lastSyncAt
          ? 'Synchronized'
          : 'Local only';

  return (
    <View style={styles.app}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <View style={styles.headerInner}>
          <View>
            <Text style={styles.eyebrow}>PRIVATE FISHING JOURNAL</Text>
            <Text style={styles.brand}>Fishing Logbook</Text>
          </View>
          <Pressable style={styles.syncBadge} onPress={() => setTab('settings')}>
            <View
              style={[
                styles.syncDot,
                {
                  backgroundColor: !isOnline || state.syncError
                    ? colors.red
                    : state.dirty
                      ? colors.amber
                      : colors.green,
                },
              ]}
            />
            <Text style={styles.syncText}>{syncLabel}</Text>
          </Pressable>
        </View>
      </SafeAreaView>

      {storageError ? <Text style={styles.errorBanner}>{storageError}</Text> : null}
      {state.syncError ? <Text style={styles.errorBanner}>{state.syncError}</Text> : null}

      <View style={styles.content}>
        {tab === 'trips' ? (
          <TripsScreen
            trips={logbook.trips}
            activeTrip={activeTrip}
            totals={totals}
            onNew={() => setEditingTripId(null)}
            onOpen={(tripId) => setSummaryTripId(tripId)}
            onManageActive={() => activeTrip && setEditingTripId(activeTrip.id)}
            onEndActive={() => endActiveTrip(localTime())}
          />
        ) : tab === 'gear' ? (
          <GearScreen logbook={logbook} onChange={updateLogbook} />
        ) : tab === 'settings' ? (
          <SettingsScreen
            state={state}
            isOnline={isOnline}
            isSyncing={isSyncing}
            onServerUrlChange={setServerUrl}
            onDownload={downloadFromServer}
            onUpload={uploadToServer}
            onLogbookChange={updateLogbook}
          />
        ) : (
          <DeferredScreen tab={tab} />
        )}
      </View>

      <SafeAreaView edges={['bottom']} style={styles.navSafe}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.nav}>
          {(['trips', 'stats', 'map', 'gear', 'gallery', 'settings'] as Tab[]).map((item) => (
            <Pressable key={item} style={styles.navButton} onPress={() => setTab(item)}>
              <View style={[styles.navMark, tab === item && styles.navMarkActive]} />
              <Text style={[styles.navText, tab === item && styles.navTextActive]}>
                {item[0].toUpperCase() + item.slice(1)}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </SafeAreaView>

      {editingTripId !== undefined ? (
        <TripEditorModal
          key={editingTripId ?? 'new'}
          trip={editingTrip}
          activeTripId={state.activeTripId}
          logbook={logbook}
          onClose={() => setEditingTripId(undefined)}
          onSave={(trip, makeActive) => {
            saveTrip(trip, makeActive);
            setEditingTripId(undefined);
          }}
          onDelete={(tripId) => {
            deleteTrip(tripId);
            setEditingTripId(undefined);
            setSummaryTripId(undefined);
          }}
        />
      ) : null}

      <TripSummaryModal
        trip={summaryTrip}
        active={summaryTrip?.id === state.activeTripId}
        onClose={() => setSummaryTripId(undefined)}
        onEdit={() => {
          if (summaryTrip) {
            setEditingTripId(summaryTrip.id);
            setSummaryTripId(undefined);
          }
        }}
      />
    </View>
  );
}

function TripsScreen({
  trips,
  activeTrip,
  totals,
  onNew,
  onOpen,
  onManageActive,
  onEndActive,
}: {
  trips: Trip[];
  activeTrip?: Trip;
  totals: { trips: number; landed: number; lost: number; hours: number };
  onNew: () => void;
  onOpen: (tripId: string) => void;
  onManageActive: () => void;
  onEndActive: () => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.titleRow}>
        <View style={styles.flex}>
          <Text style={styles.title}>Trips</Text>
          <Text style={styles.muted}>Your complete fishing history</Text>
        </View>
        {!activeTrip ? (
          <Pressable style={styles.primarySmall} onPress={onNew}>
            <Text style={styles.primaryText}>+ New Trip</Text>
          </Pressable>
        ) : null}
      </View>

      {activeTrip ? (
        <View style={styles.activeCard}>
          <Text style={styles.activeEyebrow}>ACTIVE TRIP</Text>
          <Text style={styles.activeTitle}>{activeTrip.title || activeTrip.location}</Text>
          <Text style={styles.activeMeta}>
            {activeTrip.location} • {activeTrip.method} • {activeTrip.catches.length} landed
          </Text>
          <View style={styles.activeActions}>
            <Pressable style={styles.activePrimary} onPress={onManageActive}>
              <Text style={styles.activePrimaryText}>Manage trip</Text>
            </Pressable>
            <Pressable style={styles.activeSecondary} onPress={onEndActive}>
              <Text style={styles.activeSecondaryText}>End trip</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      <View style={styles.metricRow}>
        <Metric value={totals.trips} label="Trips" />
        <Metric value={totals.landed} label="Landed" />
        <Metric value={totals.lost} label="Lost" />
        <Metric value={totals.hours.toFixed(1)} label="Hours" />
      </View>

      <Text style={styles.sectionTitle}>Trip history</Text>
      {trips.length ? (
        trips.map((trip) => (
          <Pressable key={trip.id} style={styles.tripCard} onPress={() => onOpen(trip.id)}>
            <View style={styles.dateBlock}>
              <Text style={styles.dateMonth}>{formatMonth(trip.date)}</Text>
              <Text style={styles.dateDay}>{formatDay(trip.date)}</Text>
            </View>
            <View style={styles.flex}>
              <Text style={styles.tripTitle}>{trip.title || trip.location || 'Untitled trip'}</Text>
              <Text style={styles.tripLocation}>{trip.location || 'No location'}</Text>
              <Text style={styles.tripMeta}>
                {[trip.method, trip.targetSpecies, `${trip.catches.length} landed`, `${trip.lostFish.length} lost`]
                  .filter(Boolean)
                  .join(' • ')}
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        ))
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No trips yet</Text>
          <Text style={styles.muted}>Create a trip to begin logging catches and trolling setups.</Text>
        </View>
      )}
    </ScrollView>
  );
}

function TripSummaryModal({
  trip,
  active,
  onClose,
  onEdit,
}: {
  trip?: Trip;
  active: boolean;
  onClose: () => void;
  onEdit: () => void;
}) {
  return (
    <Modal visible={Boolean(trip)} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.summaryScreen}>
        <View style={styles.summaryHeader}>
          <Pressable onPress={onClose}>
            <Text style={styles.headerAction}>Close</Text>
          </Pressable>
          <Text style={styles.summaryHeaderTitle}>Trip Summary</Text>
          <Pressable onPress={onEdit}>
            <Text style={styles.headerAction}>Edit</Text>
          </Pressable>
        </View>
        {trip ? (
          <ScrollView contentContainerStyle={styles.summaryContent}>
            <Text style={styles.summaryEyebrow}>{active ? 'ACTIVE TRIP' : trip.date}</Text>
            <Text style={styles.summaryTitle}>{trip.title || trip.location}</Text>
            <Text style={styles.summaryLocation}>
              {[trip.location, trip.launch].filter(Boolean).join(' • ')}
            </Text>
            <View style={styles.metricRow}>
              <Metric value={trip.catches.length} label="Landed" />
              <Metric value={trip.lostFish.length} label="Lost" />
              <Metric value={trip.hours || 0} label="Hours" />
            </View>
            <SummarySection
              title="Basics"
              rows={[
                ['Method', trip.method],
                ['Target', trip.targetSpecies],
                ['Time', [trip.startTime, trip.endTime].filter(Boolean).join(' – ')],
                ['Intent', trip.intent],
                ['Rating', trip.tripRating],
              ]}
            />
            <SummarySection
              title="Conditions"
              rows={[
                ['Water temperature', trip.waterTemp],
                ['Water clarity', trip.waterClarity],
                ['Weather', trip.weather],
                ['Wave height', trip.waveHeight],
                ['Structure', trip.structure],
              ]}
            />
            <SummarySection
              title="Activity"
              rows={[
                ['People', trip.people.map((person) => person.name).join(', ')],
                ['Setup lines', String(trip.gearUsed.length)],
                ['Catches', trip.catches.map((item) => item.species).filter(Boolean).join(', ')],
                ['Lost fish', trip.lostFish.map((item) => item.possibleSpecies).filter(Boolean).join(', ')],
              ]}
            />
            {trip.notes ? (
              <View style={styles.summarySection}>
                <Text style={styles.sectionTitle}>Notes</Text>
                <Text style={styles.summaryNotes}>{trip.notes}</Text>
              </View>
            ) : null}
          </ScrollView>
        ) : null}
      </SafeAreaView>
    </Modal>
  );
}

function SummarySection({ title, rows }: { title: string; rows: [string, string][] }) {
  const visibleRows = rows.filter(([, value]) => value);
  if (!visibleRows.length) return null;
  return (
    <View style={styles.summarySection}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {visibleRows.map(([label, value]) => (
        <View key={label} style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>{label}</Text>
          <Text style={styles.summaryValue}>{value}</Text>
        </View>
      ))}
    </View>
  );
}

function Metric({ value, label }: { value: string | number; label: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function DeferredScreen({ tab }: { tab: 'stats' | 'map' | 'gallery' }) {
  return (
    <View style={styles.deferred}>
      <Text style={styles.title}>{tab[0].toUpperCase() + tab.slice(1)}</Text>
      <Text style={styles.muted}>
        This area is outside the submission core. Existing records remain compatible with the web
        logbook while this mobile screen is added later.
      </Text>
    </View>
  );
}

function formatMonth(date: string) {
  if (!date) return '—';
  return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { month: 'short' }).toUpperCase();
}

function formatDay(date: string) {
  if (!date) return '';
  return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { day: 'numeric' });
}

const styles = StyleSheet.create({
  app: { flex: 1, backgroundColor: colors.background },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: colors.background },
  header: { backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.line },
  headerInner: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: 18, paddingVertical: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eyebrow: { color: colors.muted, fontSize: 10, letterSpacing: 1.2, fontWeight: '800' },
  brand: { color: colors.ink, fontSize: 22, fontWeight: '900', marginTop: 2 },
  syncBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.background, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 18 },
  syncDot: { width: 8, height: 8, borderRadius: 4 },
  syncText: { color: colors.ink, fontSize: 11, fontWeight: '800' },
  errorBanner: { color: colors.red, backgroundColor: colors.redSoft, textAlign: 'center', padding: 9, fontSize: 12 },
  content: { flex: 1, width: '100%', maxWidth: 760, alignSelf: 'center' },
  scrollContent: { padding: 18, paddingBottom: 40, gap: 14 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  flex: { flex: 1, minWidth: 0 },
  title: { color: colors.ink, fontSize: 29, fontWeight: '900' },
  muted: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  primarySmall: { backgroundColor: colors.green, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11 },
  primaryText: { color: '#FFFFFF', fontWeight: '800' },
  activeCard: { backgroundColor: colors.greenDark, borderRadius: 14, padding: 18 },
  activeEyebrow: { color: '#9ED5BE', fontSize: 10, letterSpacing: 1.1, fontWeight: '900' },
  activeTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '900', marginTop: 4 },
  activeMeta: { color: '#C9E4D8', fontSize: 13, marginTop: 4 },
  activeActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  activePrimary: { flex: 1, minHeight: 46, backgroundColor: '#FFFFFF', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  activePrimaryText: { color: colors.greenDark, fontWeight: '900' },
  activeSecondary: { flex: 1, minHeight: 46, borderWidth: 1, borderColor: '#FFFFFF55', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  activeSecondaryText: { color: '#FFFFFF', fontWeight: '800' },
  metricRow: { flexDirection: 'row', gap: 8 },
  metric: { flex: 1, minWidth: 0, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, borderRadius: 10, paddingVertical: 13, paddingHorizontal: 4, alignItems: 'center' },
  metricValue: { color: colors.ink, fontSize: 19, fontWeight: '900' },
  metricLabel: { color: colors.muted, fontSize: 10, marginTop: 2 },
  sectionTitle: { color: colors.ink, fontSize: 18, fontWeight: '900' },
  tripCard: { minHeight: 78, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, borderRadius: 10, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 12 },
  dateBlock: { width: 48, height: 52, borderRadius: 9, backgroundColor: colors.greenSoft, alignItems: 'center', justifyContent: 'center' },
  dateMonth: { color: colors.green, fontSize: 9, fontWeight: '900' },
  dateDay: { color: colors.greenDark, fontSize: 20, fontWeight: '900' },
  tripTitle: { color: colors.ink, fontSize: 15, fontWeight: '900' },
  tripLocation: { color: colors.green, fontSize: 12, fontWeight: '800', marginTop: 2 },
  tripMeta: { color: colors.muted, fontSize: 11, marginTop: 4 },
  chevron: { color: colors.muted, fontSize: 28 },
  empty: { padding: 28, alignItems: 'center', borderWidth: 1, borderStyle: 'dashed', borderColor: colors.line, borderRadius: 10 },
  emptyTitle: { color: colors.ink, fontWeight: '900', marginBottom: 4 },
  navSafe: { borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.card },
  nav: { minWidth: '100%', height: 62, paddingHorizontal: 6 },
  navButton: { minWidth: 76, alignItems: 'center', justifyContent: 'center', gap: 5 },
  navMark: { width: 25, height: 4, borderRadius: 2, backgroundColor: 'transparent' },
  navMarkActive: { backgroundColor: colors.green },
  navText: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  navTextActive: { color: colors.greenDark, fontWeight: '900' },
  summaryScreen: { flex: 1, backgroundColor: colors.background },
  summaryHeader: { minHeight: 58, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: colors.line, backgroundColor: colors.card, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  summaryHeaderTitle: { color: colors.ink, fontSize: 18, fontWeight: '900' },
  headerAction: { color: colors.green, fontWeight: '800', fontSize: 15 },
  summaryContent: { width: '100%', maxWidth: 760, alignSelf: 'center', padding: 18, paddingBottom: 45, gap: 15 },
  summaryEyebrow: { color: colors.green, fontWeight: '900', fontSize: 11, letterSpacing: 1 },
  summaryTitle: { color: colors.ink, fontSize: 28, fontWeight: '900' },
  summaryLocation: { color: colors.muted, fontSize: 14 },
  summarySection: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, borderRadius: 10, padding: 14, gap: 10 },
  summaryRow: { flexDirection: 'row', gap: 15 },
  summaryLabel: { width: 105, color: colors.muted, fontSize: 12 },
  summaryValue: { flex: 1, color: colors.ink, fontSize: 13, fontWeight: '700' },
  summaryNotes: { color: colors.ink, fontSize: 14, lineHeight: 21 },
  deferred: { padding: 18, gap: 8 },
});

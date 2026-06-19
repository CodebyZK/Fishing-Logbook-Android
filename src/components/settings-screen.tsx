import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Field, SectionTitle } from '@/components/form-controls';
import { createId } from '@/domain/logbook';
import type { AppState, LogbookDocument } from '@/types/logbook';
import { colors } from '@/ui/theme';

export function SettingsScreen({
  state,
  isOnline,
  isSyncing,
  onServerUrlChange,
  onDownload,
  onUpload,
  onLogbookChange,
}: {
  state: AppState;
  isOnline: boolean;
  isSyncing: boolean;
  onServerUrlChange: (value: string) => void;
  onDownload: () => Promise<void>;
  onUpload: () => Promise<void>;
  onLogbookChange: (value: LogbookDocument) => void;
}) {
  const [personName, setPersonName] = useState('');
  const [locationName, setLocationName] = useState('');
  const [launchNames, setLaunchNames] = useState<Record<string, string>>({});

  const run = async (action: () => Promise<void>, success: string) => {
    try {
      await action();
      Alert.alert('Success', success);
    } catch (error) {
      Alert.alert('Connection failed', error instanceof Error ? error.message : 'Unknown error.');
    }
  };

  const confirmDownload = () => {
    Alert.alert(
      'Replace local logbook?',
      state.dirty
        ? 'You have local changes that have not been uploaded. Downloading will replace them.'
        : 'This downloads the server logbook and replaces local data.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Download', style: 'destructive', onPress: () => run(onDownload, 'Server logbook downloaded.') },
      ],
    );
  };

  const confirmUpload = () => {
    Alert.alert(
      'Replace server logbook?',
      'The current API replaces the complete server document. Confirm that this device has the version you want to keep.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Upload', style: 'destructive', onPress: () => run(onUpload, 'Local logbook uploaded.') },
      ],
    );
  };

  const addPerson = () => {
    const name = personName.trim();
    if (!name) return;
    if (state.logbook.people.some((item) => item.name.toLowerCase() === name.toLowerCase())) {
      setPersonName('');
      return;
    }
    onLogbookChange({
      ...state.logbook,
      people: [...state.logbook.people, { id: createId('person'), name }],
    });
    setPersonName('');
  };

  const addLocation = () => {
    const name = locationName.trim();
    if (!name) return;
    if (state.logbook.locations.some((item) => item.name.toLowerCase() === name.toLowerCase())) {
      setLocationName('');
      return;
    }
    onLogbookChange({
      ...state.logbook,
      locations: [
        ...state.logbook.locations,
        { id: createId('loc'), name, coordinates: null, launches: [] },
      ],
    });
    setLocationName('');
  };

  const addLaunch = (locationId: string) => {
    const name = (launchNames[locationId] ?? '').trim();
    if (!name) return;
    onLogbookChange({
      ...state.logbook,
      locations: state.logbook.locations.map((location) =>
        location.id === locationId
          ? {
              ...location,
              launches: [
                ...location.launches,
                { id: createId('launch'), name, coordinates: null },
              ],
            }
          : location,
      ),
    });
    setLaunchNames((current) => ({ ...current, [locationId]: '' }));
  };

  return (
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
      <Text style={styles.title}>Settings</Text>

      <SectionTitle title="Server connection" />
      <View style={styles.statusCard}>
        <Text style={[styles.status, { color: isOnline ? colors.green : colors.red }]}>
          {isOnline ? 'Network available' : 'Offline'}
        </Text>
        <Text style={styles.statusDetail}>
          {state.dirty ? 'Local changes pending upload' : 'No pending local changes'}
        </Text>
        {state.lastSyncAt ? (
          <Text style={styles.statusDetail}>
            Last sync: {new Date(state.lastSyncAt).toLocaleString()}
          </Text>
        ) : null}
        {state.syncError ? <Text style={styles.error}>{state.syncError}</Text> : null}
      </View>
      <Field
        label="Self-hosted server URL"
        value={state.serverUrl}
        onChangeText={onServerUrlChange}
        placeholder="http://192.168.1.50:8080"
        autoCapitalize="none"
        autoCorrect={false}
      />
      <View style={styles.buttonRow}>
        <Pressable
          disabled={!state.serverUrl || !isOnline || isSyncing}
          style={[styles.secondaryButton, (!state.serverUrl || !isOnline || isSyncing) && styles.disabled]}
          onPress={confirmDownload}>
          <Text style={styles.secondaryText}>{isSyncing ? 'Working…' : 'Download'}</Text>
        </Pressable>
        <Pressable
          disabled={!state.serverUrl || !isOnline || isSyncing}
          style={[styles.primaryButton, (!state.serverUrl || !isOnline || isSyncing) && styles.disabled]}
          onPress={confirmUpload}>
          <Text style={styles.primaryText}>{isSyncing ? 'Working…' : 'Upload'}</Text>
        </Pressable>
      </View>

      <SectionTitle title={`People (${state.logbook.people.length})`} />
      {state.logbook.people.map((person) => (
        <View style={styles.row} key={person.id}>
          <Text style={styles.rowText}>{person.name}</Text>
        </View>
      ))}
      <View style={styles.addRow}>
        <View style={styles.flex}>
          <Field label="New person" value={personName} onChangeText={setPersonName} />
        </View>
        <Pressable style={styles.addButton} onPress={addPerson}>
          <Text style={styles.addText}>Add</Text>
        </Pressable>
      </View>

      <SectionTitle title={`Waterbodies and launches (${state.logbook.locations.length})`} />
      {state.logbook.locations.map((location) => (
        <View style={styles.locationCard} key={location.id}>
          <Text style={styles.locationTitle}>{location.name}</Text>
          {location.launches.map((launch) => (
            <Text key={launch.id} style={styles.launchText}>• {launch.name}</Text>
          ))}
          <View style={styles.addRow}>
            <View style={styles.flex}>
              <Field
                label="Add launch"
                value={launchNames[location.id] ?? ''}
                onChangeText={(value) =>
                  setLaunchNames((current) => ({ ...current, [location.id]: value }))
                }
              />
            </View>
            <Pressable style={styles.addButton} onPress={() => addLaunch(location.id)}>
              <Text style={styles.addText}>Add</Text>
            </Pressable>
          </View>
        </View>
      ))}
      <View style={styles.addRow}>
        <View style={styles.flex}>
          <Field label="New waterbody" value={locationName} onChangeText={setLocationName} />
        </View>
        <Pressable style={styles.addButton} onPress={addLocation}>
          <Text style={styles.addText}>Add</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { width: '100%', maxWidth: 760, alignSelf: 'center', padding: 18, paddingBottom: 45, gap: 13 },
  title: { color: colors.ink, fontSize: 29, fontWeight: '900' },
  statusCard: { padding: 14, borderWidth: 1, borderColor: colors.line, borderRadius: 10, backgroundColor: colors.card, gap: 4 },
  status: { fontWeight: '900' },
  statusDetail: { color: colors.muted, fontSize: 13 },
  error: { color: colors.red, fontSize: 13, marginTop: 3 },
  buttonRow: { flexDirection: 'row', gap: 10 },
  primaryButton: { flex: 1, minHeight: 48, borderRadius: 10, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: '#FFFFFF', fontWeight: '800' },
  secondaryButton: { flex: 1, minHeight: 48, borderRadius: 10, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { color: colors.greenDark, fontWeight: '800' },
  disabled: { opacity: 0.45 },
  row: { minHeight: 45, paddingHorizontal: 13, borderWidth: 1, borderColor: colors.line, borderRadius: 10, backgroundColor: colors.card, justifyContent: 'center' },
  rowText: { color: colors.ink, fontWeight: '700' },
  addRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  flex: { flex: 1 },
  addButton: { height: 48, paddingHorizontal: 16, borderRadius: 10, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  addText: { color: '#FFFFFF', fontWeight: '800' },
  locationCard: { padding: 13, borderWidth: 1, borderColor: colors.line, borderRadius: 10, backgroundColor: colors.card, gap: 8 },
  locationTitle: { color: colors.ink, fontWeight: '900', fontSize: 15 },
  launchText: { color: colors.muted, fontSize: 13 },
});

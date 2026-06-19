import { useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChoiceField, Field, SectionTitle, Toggle } from '@/components/form-controls';
import {
  createCatch,
  createId,
  createLostFish,
  createSetupLine,
  createTrip,
} from '@/domain/logbook';
import type {
  CatchRecord,
  LogbookDocument,
  LostFishRecord,
  Person,
  SetupLine,
  Trip,
} from '@/types/logbook';
import { colors } from '@/ui/theme';

export function TripEditorModal({
  trip,
  activeTripId,
  logbook,
  onClose,
  onSave,
  onDelete,
}: {
  trip?: Trip;
  activeTripId?: string;
  logbook: LogbookDocument;
  onClose: () => void;
  onSave: (trip: Trip, makeActive: boolean) => void;
  onDelete: (tripId: string) => void;
}) {
  const [draft, setDraft] = useState<Trip>(() => structuredClone(trip ?? createTrip()));
  const [newPerson, setNewPerson] = useState('');
  const [setupIndex, setSetupIndex] = useState<number>();
  const [catchIndex, setCatchIndex] = useState<number>();
  const [lostIndex, setLostIndex] = useState<number>();

  const update = <K extends keyof Trip>(key: K, value: Trip[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const selectLocation = (locationId: string) => {
    const location = logbook.locations.find((item) => item.id === locationId);
    setDraft((current) => ({
      ...current,
      locationId,
      location: location?.name ?? '',
      launchId: '',
      launch: '',
    }));
  };

  const selectLaunch = (launchId: string) => {
    const location = logbook.locations.find((item) => item.id === draft.locationId);
    const launch = location?.launches.find((item) => item.id === launchId);
    setDraft((current) => ({
      ...current,
      launchId,
      launch: launch?.name ?? '',
    }));
  };

  const togglePerson = (person: Person) => {
    setDraft((current) => ({
      ...current,
      people: current.people.some((item) => item.id === person.id)
        ? current.people.filter((item) => item.id !== person.id)
        : [...current.people, person],
    }));
  };

  const addPerson = () => {
    const name = newPerson.trim();
    if (!name) {
      return;
    }
    const existing = logbook.people.find((person) => person.name.toLowerCase() === name.toLowerCase());
    const person = existing ?? { id: createId('person'), name };
    if (!draft.people.some((item) => item.id === person.id)) {
      update('people', [...draft.people, person]);
    }
    setNewPerson('');
  };

  const save = () => {
    if (!draft.date || !draft.location.trim()) {
      Alert.alert('Missing trip details', 'Date and location are required.');
      return;
    }
    const makeActive = draft.id === activeTripId || (!trip && !draft.endTime);
    onSave(draft, makeActive);
  };

  const confirmDelete = () => {
    Alert.alert('Delete trip?', 'This removes the trip and all nested catches and setup lines.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => onDelete(draft.id),
      },
    ]);
  };

  const selectedLocation = logbook.locations.find((item) => item.id === draft.locationId);

  return (
    <>
      <Modal visible animationType="slide" onRequestClose={onClose}>
        <SafeAreaView style={styles.screen}>
          <View style={styles.header}>
            <Pressable onPress={onClose}>
              <Text style={styles.headerAction}>Cancel</Text>
            </Pressable>
            <Text style={styles.headerTitle}>{trip ? 'Edit Trip' : 'New Trip'}</Text>
            <Pressable onPress={save}>
              <Text style={styles.headerAction}>Save</Text>
            </Pressable>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
            <SectionTitle title="Trip basics" />
            <Field label="Title" value={draft.title} onChangeText={(value) => update('title', value)} />
            <Field
              label="Date *"
              value={draft.date}
              onChangeText={(value) => update('date', value)}
              placeholder="YYYY-MM-DD"
            />
            {logbook.locations.length ? (
              <ChoiceField
                label="Saved waterbody"
                value={draft.locationId}
                options={logbook.locations.map((item) => ({ value: item.id, label: item.name }))}
                onChange={selectLocation}
                emptyLabel="Type a location below"
              />
            ) : null}
            <Field
              label="Waterbody / location *"
              value={draft.location}
              onChangeText={(value) =>
                setDraft((current) => ({ ...current, location: value, locationId: '' }))
              }
            />
            {selectedLocation?.launches.length ? (
              <ChoiceField
                label="Launch"
                value={draft.launchId}
                options={selectedLocation.launches.map((item) => ({ value: item.id, label: item.name }))}
                onChange={selectLaunch}
              />
            ) : (
              <Field label="Launch" value={draft.launch} onChangeText={(value) => update('launch', value)} />
            )}
            <View style={styles.twoColumn}>
              <View style={styles.column}>
                <Field
                  label="Start time"
                  value={draft.startTime}
                  onChangeText={(value) => update('startTime', value)}
                  placeholder="HH:MM"
                />
              </View>
              <View style={styles.column}>
                <Field
                  label="End time"
                  value={draft.endTime}
                  onChangeText={(value) => update('endTime', value)}
                  placeholder="HH:MM"
                />
              </View>
            </View>
            <ChoiceField
              label="Target species"
              value={draft.targetSpecies}
              options={logbook.species.map((item) => ({ value: item, label: item }))}
              onChange={(value) => update('targetSpecies', value)}
            />
            <ChoiceField
              label="Method"
              value={draft.method}
              options={logbook.methods.map((item) => ({ value: item, label: item }))}
              onChange={(value) => update('method', value)}
            />
            <Field label="Intent" value={draft.intent} onChangeText={(value) => update('intent', value)} />
            <Field
              label="Trip rating"
              value={draft.tripRating}
              onChangeText={(value) => update('tripRating', value)}
              placeholder="1-5"
              keyboardType="numeric"
            />

            <SectionTitle title="Conditions and notes" />
            <View style={styles.twoColumn}>
              <View style={styles.column}>
                <Field
                  label="Water temperature"
                  value={draft.waterTemp}
                  onChangeText={(value) => update('waterTemp', value)}
                />
              </View>
              <View style={styles.column}>
                <Field
                  label="Wave height"
                  value={draft.waveHeight}
                  onChangeText={(value) => update('waveHeight', value)}
                />
              </View>
            </View>
            <ChoiceField
              label="Water clarity"
              value={draft.waterClarity}
              options={logbook.waterClarities.map((item) => ({ value: item, label: item }))}
              onChange={(value) => update('waterClarity', value)}
            />
            <ChoiceField
              label="Manual weather"
              value={draft.weather}
              options={logbook.weatherTypes.map((item) => ({ value: item, label: item }))}
              onChange={(value) => update('weather', value)}
            />
            <Field
              label="Structure / depth"
              value={draft.structure}
              onChangeText={(value) => update('structure', value)}
            />
            <Field
              label="Notes"
              value={draft.notes}
              onChangeText={(value) => update('notes', value)}
              multiline
            />

            <SectionTitle title="People" />
            <View style={styles.chips}>
              {logbook.people.map((person) => {
                const selected = draft.people.some((item) => item.id === person.id);
                return (
                  <Pressable
                    key={person.id}
                    style={[styles.chip, selected && styles.chipSelected]}
                    onPress={() => togglePerson(person)}>
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                      {person.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.inlineAdd}>
              <View style={styles.column}>
                <Field label="Add person" value={newPerson} onChangeText={setNewPerson} />
              </View>
              <Pressable style={styles.addButton} onPress={addPerson}>
                <Text style={styles.addButtonText}>Add</Text>
              </Pressable>
            </View>

            {draft.method === 'Trolling' ? (
              <>
                <SectionTitle
                  title="Trolling setup"
                  action="+ Add line"
                  onAction={() => {
                    update('gearUsed', [...draft.gearUsed, createSetupLine()]);
                    setSetupIndex(draft.gearUsed.length);
                  }}
                />
                {draft.gearUsed.map((setup, index) => (
                  <RecordCard
                    key={setup.id}
                    title={setup.lineLabel || `Rod ${index + 1}`}
                    subtitle={[
                      setup.side,
                      labelFor(logbook.trollingPresentations, setup.presentation),
                      nameFor(logbook.lures, setup.lureId),
                    ]
                      .filter(Boolean)
                      .join(' • ')}
                    onPress={() => setSetupIndex(index)}
                  />
                ))}
              </>
            ) : null}

            <SectionTitle
              title={`Catches (${draft.catches.length})`}
              action="+ Add catch"
              onAction={() => {
                update('catches', [...draft.catches, createCatch()]);
                setCatchIndex(draft.catches.length);
              }}
            />
            {draft.catches.map((catchItem, index) => (
              <RecordCard
                key={catchItem.id}
                title={catchItem.species || `Catch ${index + 1}`}
                subtitle={[
                  catchItem.time,
                  catchItem.released ? 'Released' : 'Kept',
                  setupName(draft.gearUsed, catchItem.setupLineId),
                ]
                  .filter(Boolean)
                  .join(' • ')}
                onPress={() => setCatchIndex(index)}
              />
            ))}

            <SectionTitle
              title={`Lost fish (${draft.lostFish.length})`}
              action="+ Add lost fish"
              onAction={() => {
                update('lostFish', [...draft.lostFish, createLostFish()]);
                setLostIndex(draft.lostFish.length);
              }}
            />
            {draft.lostFish.map((fish, index) => (
              <RecordCard
                key={fish.id}
                title={fish.possibleSpecies || `Lost fish ${index + 1}`}
                subtitle={[fish.time, setupName(draft.gearUsed, fish.setupLineId)]
                  .filter(Boolean)
                  .join(' • ')}
                onPress={() => setLostIndex(index)}
              />
            ))}

            {trip ? (
              <Pressable style={styles.deleteButton} onPress={confirmDelete}>
                <Text style={styles.deleteText}>Delete trip</Text>
              </Pressable>
            ) : null}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {setupIndex !== undefined && draft.gearUsed[setupIndex] ? (
        <SetupEditor
          value={draft.gearUsed[setupIndex]}
          logbook={logbook}
          people={draft.people}
          onClose={() => setSetupIndex(undefined)}
          onSave={(value) => {
            update(
              'gearUsed',
              draft.gearUsed.map((item, index) => (index === setupIndex ? value : item)),
            );
            setSetupIndex(undefined);
          }}
          onDelete={() => {
            const removedId = draft.gearUsed[setupIndex].id;
            setDraft((current) => ({
              ...current,
              gearUsed: current.gearUsed.filter((_, index) => index !== setupIndex),
              catches: current.catches.map((item) =>
                item.setupLineId === removedId ? { ...item, setupLineId: '' } : item,
              ),
              lostFish: current.lostFish.map((item) =>
                item.setupLineId === removedId ? { ...item, setupLineId: '' } : item,
              ),
            }));
            setSetupIndex(undefined);
          }}
        />
      ) : null}

      {catchIndex !== undefined && draft.catches[catchIndex] ? (
        <FishEditor
          value={draft.catches[catchIndex]}
          lost={false}
          trip={draft}
          logbook={logbook}
          onClose={() => setCatchIndex(undefined)}
          onSave={(value) => {
            update(
              'catches',
              draft.catches.map((item, index) =>
                index === catchIndex ? (value as CatchRecord) : item,
              ),
            );
            setCatchIndex(undefined);
          }}
          onDelete={() => {
            update(
              'catches',
              draft.catches.filter((_, index) => index !== catchIndex),
            );
            setCatchIndex(undefined);
          }}
        />
      ) : null}

      {lostIndex !== undefined && draft.lostFish[lostIndex] ? (
        <FishEditor
          value={draft.lostFish[lostIndex]}
          lost
          trip={draft}
          logbook={logbook}
          onClose={() => setLostIndex(undefined)}
          onSave={(value) => {
            update(
              'lostFish',
              draft.lostFish.map((item, index) =>
                index === lostIndex ? (value as LostFishRecord) : item,
              ),
            );
            setLostIndex(undefined);
          }}
          onDelete={() => {
            update(
              'lostFish',
              draft.lostFish.filter((_, index) => index !== lostIndex),
            );
            setLostIndex(undefined);
          }}
        />
      ) : null}
    </>
  );
}

function SetupEditor({
  value,
  logbook,
  people,
  onClose,
  onSave,
  onDelete,
}: {
  value: SetupLine;
  logbook: LogbookDocument;
  people: Person[];
  onClose: () => void;
  onSave: (value: SetupLine) => void;
  onDelete: () => void;
}) {
  const [draft, setDraft] = useState(() => structuredClone(value));
  const update = <K extends keyof SetupLine>(key: K, next: SetupLine[K]) =>
    setDraft((current) => ({ ...current, [key]: next }));

  return (
    <ItemEditor title="Setup line" onClose={onClose} onSave={() => onSave(draft)} onDelete={onDelete}>
      <Field label="Line label" value={draft.lineLabel} onChangeText={(text) => update('lineLabel', text)} />
      <View style={styles.twoColumn}>
        <View style={styles.column}>
          <Field label="Start" value={draft.startTime} onChangeText={(text) => update('startTime', text)} />
        </View>
        <View style={styles.column}>
          <Field label="End" value={draft.endTime} onChangeText={(text) => update('endTime', text)} />
        </View>
      </View>
      <ChoiceField label="Side" value={draft.side} options={logbook.setupLineSides} onChange={(text) => update('side', text)} />
      <ChoiceField
        label="Person"
        value={draft.personId}
        options={people.map((item) => ({ value: item.id, label: item.name }))}
        onChange={(text) => update('personId', text)}
      />
      <ChoiceField
        label="Rod/reel combo"
        value={draft.comboId}
        options={logbook.rodReelCombos.map((item) => ({ value: item.id, label: item.shortName }))}
        onChange={(text) => update('comboId', text)}
      />
      <ChoiceField
        label="Rod"
        value={draft.rodId}
        options={logbook.rods.map((item) => ({ value: item.id, label: item.shortName || item.name }))}
        onChange={(text) => update('rodId', text)}
      />
      <ChoiceField
        label="Reel"
        value={draft.reelId}
        options={logbook.reels.map((item) => ({ value: item.id, label: item.shortName || item.name }))}
        onChange={(text) => update('reelId', text)}
      />
      <ChoiceField
        label="Lure"
        value={draft.lureId}
        options={logbook.lures.map((item) => ({ value: item.id, label: item.name }))}
        onChange={(text) => update('lureId', text)}
      />
      <ChoiceField
        label="Flasher"
        value={draft.flasherId}
        options={logbook.flashers.map((item) => ({ value: item.id, label: item.name }))}
        onChange={(text) => update('flasherId', text)}
      />
      <ChoiceField
        label="Presentation"
        value={draft.presentation}
        options={logbook.trollingPresentations}
        onChange={(text) => update('presentation', text)}
      />
      {draft.presentation === 'downrigger' ? (
        <Toggle label="Deepest rigger" value={draft.deepestRigger} onChange={(next) => update('deepestRigger', next)} />
      ) : null}
      <Field label="Change note" value={draft.changeNote} onChangeText={(text) => update('changeNote', text)} multiline />
    </ItemEditor>
  );
}

function FishEditor({
  value,
  lost,
  trip,
  logbook,
  onClose,
  onSave,
  onDelete,
}: {
  value: CatchRecord | LostFishRecord;
  lost: boolean;
  trip: Trip;
  logbook: LogbookDocument;
  onClose: () => void;
  onSave: (value: CatchRecord | LostFishRecord) => void;
  onDelete: () => void;
}) {
  const [draft, setDraft] = useState(() => structuredClone(value));
  const update = (key: string, next: unknown) =>
    setDraft((current) => ({ ...current, [key]: next }));
  const landed = !lost ? (draft as CatchRecord) : undefined;
  const manual = landed?.manualCoordinates;

  return (
    <ItemEditor title={lost ? 'Lost fish' : 'Catch'} onClose={onClose} onSave={() => onSave(draft)} onDelete={onDelete}>
      <ChoiceField
        label={lost ? 'Possible species' : 'Species'}
        value={lost ? (draft as LostFishRecord).possibleSpecies : (draft as CatchRecord).species}
        options={logbook.species.map((item) => ({ value: item, label: item }))}
        onChange={(text) => update(lost ? 'possibleSpecies' : 'species', text)}
      />
      <ChoiceField
        label="Person"
        value={draft.personId}
        options={trip.people.map((item) => ({ value: item.id, label: item.name }))}
        onChange={(text) => update('personId', text)}
      />
      <Field label="Time" value={draft.time} onChangeText={(text) => update('time', text)} />
      {!lost && landed ? (
        <>
          <Toggle label="Released" value={landed.released} onChange={(next) => update('released', next)} />
          <View style={styles.twoColumn}>
            <View style={styles.column}>
              <Field label="Length" value={landed.length} onChangeText={(text) => update('length', text)} />
            </View>
            <View style={styles.column}>
              <Field label="Weight" value={landed.weight} onChangeText={(text) => update('weight', text)} />
            </View>
          </View>
        </>
      ) : null}
      {trip.method === 'Trolling' ? (
        <ChoiceField
          label="Producing setup line"
          value={draft.setupLineId}
          options={trip.gearUsed.map((item, index) => ({
            value: item.id,
            label: item.lineLabel || `Rod ${index + 1}`,
          }))}
          onChange={(text) => update('setupLineId', text)}
        />
      ) : (
        <ChoiceField
          label="Lure"
          value={draft.lureId}
          options={logbook.lures.map((item) => ({ value: item.id, label: item.name }))}
          onChange={(text) => update('lureId', text)}
        />
      )}
      <View style={styles.twoColumn}>
        <View style={styles.column}>
          <Field label="Water depth" value={draft.waterDepth} onChangeText={(text) => update('waterDepth', text)} />
        </View>
        <View style={styles.column}>
          <Field label="Depth down" value={draft.depthDown} onChangeText={(text) => update('depthDown', text)} />
        </View>
      </View>
      {trip.method === 'Trolling' ? (
        <>
          <ChoiceField
            label="Presentation"
            value={draft.presentation}
            options={logbook.trollingPresentations}
            onChange={(text) => update('presentation', text)}
          />
          <ChoiceField
            label="Direction"
            value={draft.direction}
            options={logbook.trollingDirections.map((item) => ({ value: item, label: item }))}
            onChange={(text) => update('direction', text)}
          />
          <View style={styles.twoColumn}>
            <View style={styles.column}>
              <Field label="FOW caught" value={draft.fowCaught} onChangeText={(text) => update('fowCaught', text)} />
            </View>
            <View style={styles.column}>
              <Field label="Speed" value={draft.speed} onChangeText={(text) => update('speed', text)} />
            </View>
          </View>
          <Field label="Ball depth" value={draft.ballDepth} onChangeText={(text) => update('ballDepth', text)} />
          <Field label="Line behind board" value={draft.lineBehindBoard} onChangeText={(text) => update('lineBehindBoard', text)} />
          <Field label="Estimated lure depth" value={draft.estimatedLureDepth} onChangeText={(text) => update('estimatedLureDepth', text)} />
          <Field label="Dipsey setting" value={draft.dipseySetting} onChangeText={(text) => update('dipseySetting', text)} />
          <Field label="Line out" value={draft.lineOut} onChangeText={(text) => update('lineOut', text)} />
          <Field label="Estimated depth" value={draft.estimatedDepth} onChangeText={(text) => update('estimatedDepth', text)} />
        </>
      ) : trip.method === 'Casting' ? (
        <Field label="Retrieve" value={draft.retrieve} onChangeText={(text) => update('retrieve', text)} />
      ) : null}
      {!lost && landed ? (
        <View style={styles.twoColumn}>
          <View style={styles.column}>
            <Field
              label="Manual latitude"
              value={manual?.latitude?.toString() ?? ''}
              onChangeText={(text) =>
                update(
                  'manualCoordinates',
                  text || manual?.longitude
                    ? { latitude: Number(text), longitude: manual?.longitude ?? 0 }
                    : null,
                )
              }
              keyboardType="decimal-pad"
            />
          </View>
          <View style={styles.column}>
            <Field
              label="Manual longitude"
              value={manual?.longitude?.toString() ?? ''}
              onChangeText={(text) =>
                update(
                  'manualCoordinates',
                  text || manual?.latitude
                    ? { latitude: manual?.latitude ?? 0, longitude: Number(text) }
                    : null,
                )
              }
              keyboardType="decimal-pad"
            />
          </View>
        </View>
      ) : null}
      <Field label="Notes" value={draft.notes} onChangeText={(text) => update('notes', text)} multiline />
    </ItemEditor>
  );
}

function ItemEditor({
  title,
  children,
  onClose,
  onSave,
  onDelete,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  onSave: () => void;
  onDelete: () => void;
}) {
  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.screen}>
        <View style={styles.header}>
          <Pressable onPress={onClose}>
            <Text style={styles.headerAction}>Cancel</Text>
          </Pressable>
          <Text style={styles.headerTitle}>{title}</Text>
          <Pressable onPress={onSave}>
            <Text style={styles.headerAction}>Save</Text>
          </Pressable>
        </View>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
          {children}
          <Pressable style={styles.deleteButton} onPress={onDelete}>
            <Text style={styles.deleteText}>Remove</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function RecordCard({
  title,
  subtitle,
  onPress,
}: {
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.recordCard} onPress={onPress}>
      <View style={styles.column}>
        <Text style={styles.recordTitle}>{title}</Text>
        <Text style={styles.recordSubtitle}>{subtitle || 'Tap to add details'}</Text>
      </View>
      <Text style={styles.recordChevron}>›</Text>
    </Pressable>
  );
}

function labelFor(options: { value: string; label: string }[], value: string) {
  return options.find((item) => item.value === value)?.label ?? '';
}

function nameFor(options: { id: string; name: string }[], id: string) {
  return options.find((item) => item.id === id)?.name ?? '';
}

function setupName(setups: SetupLine[], id: string) {
  const index = setups.findIndex((item) => item.id === id);
  return index >= 0 ? setups[index].lineLabel || `Rod ${index + 1}` : '';
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    minHeight: 58,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    backgroundColor: colors.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { color: colors.ink, fontSize: 18, fontWeight: '900' },
  headerAction: { color: colors.green, fontSize: 15, fontWeight: '800' },
  content: { width: '100%', maxWidth: 760, alignSelf: 'center', padding: 18, paddingBottom: 50, gap: 14 },
  twoColumn: { flexDirection: 'row', gap: 10 },
  column: { flex: 1, minWidth: 0 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    borderRadius: 20,
    paddingVertical: 9,
    paddingHorizontal: 13,
  },
  chipSelected: { backgroundColor: colors.greenSoft, borderColor: colors.green },
  chipText: { color: colors.muted, fontWeight: '700' },
  chipTextSelected: { color: colors.greenDark },
  inlineAdd: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  addButton: {
    height: 48,
    borderRadius: 10,
    backgroundColor: colors.green,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: { color: '#FFFFFF', fontWeight: '800' },
  recordCard: {
    minHeight: 64,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    backgroundColor: colors.card,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordTitle: { color: colors.ink, fontSize: 15, fontWeight: '800' },
  recordSubtitle: { color: colors.muted, fontSize: 12, marginTop: 3 },
  recordChevron: { color: colors.muted, fontSize: 28 },
  deleteButton: {
    marginTop: 12,
    minHeight: 48,
    borderRadius: 10,
    backgroundColor: colors.redSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: { color: colors.red, fontWeight: '800' },
});

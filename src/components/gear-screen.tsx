import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChoiceField, Field, SectionTitle } from '@/components/form-controls';
import { createId } from '@/domain/logbook';
import type { LogbookDocument } from '@/types/logbook';
import { colors } from '@/ui/theme';

type GearKind = 'lures' | 'flashers' | 'rods' | 'reels' | 'rodReelCombos';
type GearItem = { id: string; [key: string]: unknown };

export function GearScreen({
  logbook,
  onChange,
}: {
  logbook: LogbookDocument;
  onChange: (logbook: LogbookDocument) => void;
}) {
  const [kind, setKind] = useState<GearKind>('lures');
  const [editId, setEditId] = useState<string | null>();
  const items = logbook[kind] as GearItem[];

  const remove = (id: string) => {
    onChange({
      ...logbook,
      [kind]: items.filter((item) => item.id !== id),
    });
    setEditId(undefined);
  };

  return (
    <>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Gear</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.tabs}>
            {(
              [
                ['lures', 'Lures'],
                ['flashers', 'Flashers'],
                ['rods', 'Rods'],
                ['reels', 'Reels'],
                ['rodReelCombos', 'Combos'],
              ] as [GearKind, string][]
            ).map(([value, label]) => (
              <Pressable
                key={value}
                style={[styles.tab, kind === value && styles.tabActive]}
                onPress={() => setKind(value)}>
                <Text style={[styles.tabText, kind === value && styles.tabTextActive]}>{label}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
        <SectionTitle title={`${labelForKind(kind)} (${items.length})`} action="+ Add" onAction={() => setEditId(null)} />
        {items.length ? (
          items.map((item) => (
            <Pressable key={item.id} style={styles.card} onPress={() => setEditId(item.id)}>
              <View style={styles.flex}>
                <Text style={styles.cardTitle}>{gearName(item)}</Text>
                <Text style={styles.cardMeta}>{gearMeta(kind, item)}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          ))
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No {labelForKind(kind).toLowerCase()} yet</Text>
            <Text style={styles.emptyText}>Add the gear needed by trip setup and catch records.</Text>
          </View>
        )}
      </ScrollView>
      {editId !== undefined ? (
        <GearEditor
          kind={kind}
          logbook={logbook}
          item={items.find((item) => item.id === editId)}
          onClose={() => setEditId(undefined)}
          onDelete={remove}
          onSave={(item) => {
            const exists = items.some((current) => current.id === item.id);
            onChange({
              ...logbook,
              [kind]: exists
                ? items.map((current) => (current.id === item.id ? item : current))
                : [...items, item],
            });
            setEditId(undefined);
          }}
        />
      ) : null}
    </>
  );
}

function GearEditor({
  kind,
  logbook,
  item,
  onClose,
  onSave,
  onDelete,
}: {
  kind: GearKind;
  logbook: LogbookDocument;
  item?: GearItem;
  onClose: () => void;
  onSave: (item: GearItem) => void;
  onDelete: (id: string) => void;
}) {
  const [draft, setDraft] = useState<Record<string, unknown>>(() =>
    structuredClone(item ?? createGear(kind)),
  );
  const update = (key: string, value: unknown) => setDraft((current) => ({ ...current, [key]: value }));

  const nameKey = kind === 'lures' || kind === 'flashers' ? 'name' : 'shortName';
  const name = String(draft[nameKey] ?? '').trim();

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.screen}>
        <View style={styles.header}>
          <Pressable onPress={onClose}>
            <Text style={styles.action}>Cancel</Text>
          </Pressable>
          <Text style={styles.headerTitle}>{item ? 'Edit' : 'Add'} {singular(kind)}</Text>
          <Pressable
            onPress={() => {
              if (name) {
                onSave(draft as GearItem);
              }
            }}>
            <Text style={styles.action}>Save</Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.editorContent}>
          {(kind === 'lures' || kind === 'flashers') ? (
            <>
              <Field label="Name *" value={String(draft.name ?? '')} onChangeText={(value) => update('name', value)} />
              <ChoiceField
                label="Type"
                value={String(draft.type ?? '')}
                options={(kind === 'lures' ? logbook.lureTypes : logbook.flasherTypes).map((value) => ({ value, label: value }))}
                onChange={(value) => update('type', value)}
              />
              <Field label="Brand" value={String(draft.brand ?? '')} onChangeText={(value) => update('brand', value)} />
              <Field label="Color" value={String(draft.color ?? '')} onChangeText={(value) => update('color', value)} />
            </>
          ) : kind === 'rods' ? (
            <>
              <Field label="Short name *" value={String(draft.shortName ?? '')} onChangeText={(value) => update('shortName', value)} />
              <ChoiceField label="Type" value={String(draft.type ?? '')} options={logbook.rodTypes.map((value) => ({ value, label: value }))} onChange={(value) => update('type', value)} />
              <Field label="Brand" value={String(draft.brand ?? '')} onChangeText={(value) => update('brand', value)} />
              <Field label="Model / name" value={String(draft.name ?? '')} onChangeText={(value) => update('name', value)} />
              <Field label="Length" value={String(draft.length ?? '')} onChangeText={(value) => update('length', value)} />
              <Field label="Power" value={String(draft.power ?? '')} onChangeText={(value) => update('power', value)} />
              <Field label="Action" value={String(draft.action ?? '')} onChangeText={(value) => update('action', value)} />
            </>
          ) : kind === 'reels' ? (
            <>
              <Field label="Short name *" value={String(draft.shortName ?? '')} onChangeText={(value) => update('shortName', value)} />
              <ChoiceField label="Style" value={String(draft.style ?? '')} options={logbook.reelStyles.map((value) => ({ value, label: value }))} onChange={(value) => update('style', value)} />
              <Field label="Brand" value={String(draft.brand ?? '')} onChangeText={(value) => update('brand', value)} />
              <Field label="Model / name" value={String(draft.name ?? '')} onChangeText={(value) => update('name', value)} />
              <Field label="Size" value={String(draft.size ?? '')} onChangeText={(value) => update('size', value)} />
              <Field label="Gear ratio" value={String(draft.gearRatio ?? '')} onChangeText={(value) => update('gearRatio', value)} />
              <Field label="Retrieve rate" value={String(draft.retrieveRate ?? '')} onChangeText={(value) => update('retrieveRate', value)} />
            </>
          ) : (
            <>
              <Field label="Short name *" value={String(draft.shortName ?? '')} onChangeText={(value) => update('shortName', value)} />
              <ChoiceField label="Rod" value={String(draft.rodId ?? '')} options={logbook.rods.map((value) => ({ value: value.id, label: value.shortName || value.name }))} onChange={(value) => update('rodId', value)} />
              <ChoiceField label="Reel" value={String(draft.reelId ?? '')} options={logbook.reels.map((value) => ({ value: value.id, label: value.shortName || value.name }))} onChange={(value) => update('reelId', value)} />
            </>
          )}
          <Field label="Notes" value={String(draft.notes ?? '')} onChangeText={(value) => update('notes', value)} multiline />
          {item ? (
            <Pressable style={styles.deleteButton} onPress={() => onDelete(String(draft.id))}>
              <Text style={styles.deleteText}>Delete {singular(kind).toLowerCase()}</Text>
            </Pressable>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function createGear(kind: GearKind) {
  const common = { id: createId(kind.slice(0, -1)), notes: '' };
  if (kind === 'lures' || kind === 'flashers') {
    return { ...common, name: '', type: '', brand: '', color: '' };
  }
  if (kind === 'rods') {
    return { ...common, shortName: '', type: '', brand: '', name: '', length: '', power: '', action: '', lureRating: '', purchaseAmount: '', dateBought: '' };
  }
  if (kind === 'reels') {
    return { ...common, shortName: '', style: '', brand: '', name: '', size: '', weight: '', gearRatio: '', retrieveRate: '', maxDrag: '', monoCapacity: '', braidCapacity: '', purchaseAmount: '', dateBought: '', lineHistory: [] };
  }
  return { ...common, shortName: '', rodId: '', reelId: '' };
}

function gearName(item: Record<string, unknown>) {
  return String(item.shortName || item.name || 'Unnamed gear');
}

function gearMeta(kind: GearKind, item: Record<string, unknown>) {
  if (kind === 'rodReelCombos') return 'Rod / reel combination';
  return [item.type || item.style, item.brand, item.name !== item.shortName ? item.name : ''].filter(Boolean).join(' • ');
}

function labelForKind(kind: GearKind) {
  return { lures: 'Lures', flashers: 'Flashers', rods: 'Rods', reels: 'Reels', rodReelCombos: 'Combos' }[kind];
}

function singular(kind: GearKind) {
  return { lures: 'Lure', flashers: 'Flasher', rods: 'Rod', reels: 'Reel', rodReelCombos: 'Combo' }[kind];
}

const styles = StyleSheet.create({
  content: { width: '100%', maxWidth: 760, alignSelf: 'center', padding: 18, paddingBottom: 40, gap: 12 },
  title: { color: colors.ink, fontSize: 29, fontWeight: '900' },
  tabs: { flexDirection: 'row', gap: 8 },
  tab: { borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card, borderRadius: 18, paddingHorizontal: 13, paddingVertical: 8 },
  tabActive: { backgroundColor: colors.greenSoft, borderColor: colors.green },
  tabText: { color: colors.muted, fontWeight: '700' },
  tabTextActive: { color: colors.greenDark },
  card: { minHeight: 64, borderWidth: 1, borderColor: colors.line, borderRadius: 10, backgroundColor: colors.card, padding: 13, flexDirection: 'row', alignItems: 'center' },
  flex: { flex: 1 },
  cardTitle: { color: colors.ink, fontWeight: '800', fontSize: 15 },
  cardMeta: { color: colors.muted, fontSize: 12, marginTop: 4 },
  chevron: { color: colors.muted, fontSize: 28 },
  empty: { padding: 24, alignItems: 'center', borderWidth: 1, borderStyle: 'dashed', borderColor: colors.line, borderRadius: 10 },
  emptyTitle: { color: colors.ink, fontWeight: '800' },
  emptyText: { color: colors.muted, fontSize: 13, textAlign: 'center', marginTop: 4 },
  screen: { flex: 1, backgroundColor: colors.background },
  header: { minHeight: 58, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: colors.line, backgroundColor: colors.card, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { color: colors.ink, fontSize: 18, fontWeight: '900' },
  action: { color: colors.green, fontWeight: '800', fontSize: 15 },
  editorContent: { width: '100%', maxWidth: 760, alignSelf: 'center', padding: 18, paddingBottom: 50, gap: 14 },
  deleteButton: { minHeight: 48, borderRadius: 10, backgroundColor: colors.redSoft, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  deleteText: { color: colors.red, fontWeight: '800' },
});

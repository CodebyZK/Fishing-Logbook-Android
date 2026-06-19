import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/ui/theme';

export function Field({
  label,
  multiline,
  ...props
}: React.ComponentProps<typeof TextInput> & { label: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...props}
        multiline={multiline}
        placeholderTextColor="#8B96A9"
        selectionColor={colors.green}
        style={[styles.input, multiline && styles.multiline]}
      />
    </View>
  );
}

export function ChoiceField({
  label,
  value,
  options,
  onChange,
  emptyLabel = 'None',
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  emptyLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value)?.label || emptyLabel;
  return (
    <>
      <View style={styles.field}>
        <Text style={styles.label}>{label}</Text>
        <Pressable style={styles.choice} onPress={() => setOpen(true)}>
          <Text style={[styles.choiceText, !value && styles.placeholder]}>{selected}</Text>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      </View>
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={styles.backdrop}>
          <SafeAreaView edges={['bottom']} style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{label}</Text>
              <Pressable onPress={() => setOpen(false)}>
                <Text style={styles.done}>Done</Text>
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={styles.optionList}>
              <Option
                label={emptyLabel}
                selected={!value}
                onPress={() => {
                  onChange('');
                  setOpen(false);
                }}
              />
              {options.map((option) => (
                <Option
                  key={`${option.value}-${option.label}`}
                  label={option.label}
                  selected={option.value === value}
                  onPress={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                />
              ))}
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
    </>
  );
}

function Option({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.option, selected && styles.optionSelected]} onPress={onPress}>
      <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{label}</Text>
      {selected ? <Text style={styles.check}>✓</Text> : null}
    </Pressable>
  );
}

export function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <Pressable style={[styles.toggle, value && styles.toggleActive]} onPress={() => onChange(!value)}>
      <View style={[styles.checkbox, value && styles.checkboxActive]}>
        <Text style={styles.checkText}>{value ? '✓' : ''}</Text>
      </View>
      <Text style={[styles.toggleText, value && styles.toggleTextActive]}>{label}</Text>
    </Pressable>
  );
}

export function SectionTitle({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.sectionTitleRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action && onAction ? (
        <Pressable onPress={onAction}>
          <Text style={styles.sectionAction}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 6 },
  label: { color: colors.ink, fontSize: 13, fontWeight: '800' },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    paddingVertical: 11,
    color: colors.ink,
    fontSize: 15,
  },
  multiline: { minHeight: 92, textAlignVertical: 'top' },
  choice: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  choiceText: { flex: 1, color: colors.ink, fontSize: 15 },
  placeholder: { color: '#8B96A9' },
  chevron: { color: colors.muted, fontSize: 25 },
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#07152E88' },
  sheet: {
    maxHeight: '80%',
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  sheetTitle: { color: colors.ink, fontSize: 20, fontWeight: '800' },
  done: { color: colors.green, fontWeight: '800' },
  optionList: { padding: 12, gap: 7 },
  option: {
    minHeight: 48,
    borderRadius: 10,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
  },
  optionSelected: { borderColor: colors.green, backgroundColor: colors.greenSoft },
  optionText: { flex: 1, color: colors.ink, fontSize: 15 },
  optionTextSelected: { color: colors.greenDark, fontWeight: '800' },
  check: { color: colors.green, fontWeight: '900' },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  toggleActive: {},
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
  },
  checkboxActive: { backgroundColor: colors.green, borderColor: colors.green },
  checkText: { color: '#FFFFFF', fontWeight: '900' },
  toggleText: { color: colors.ink, fontSize: 14 },
  toggleTextActive: { fontWeight: '700' },
  sectionTitleRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: { color: colors.ink, fontSize: 18, fontWeight: '900' },
  sectionAction: { color: colors.green, fontSize: 14, fontWeight: '800' },
});

import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

import { DashboardColors, useDashboardTheme } from '@/components/dashboard/theme';

type FormFieldProps = {
  label: string;
  children: React.ReactNode;
};

type FormTextInputProps = TextInputProps & {
  label: string;
};

type MoneyFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
};

type SegmentButtonProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

export function FormField({ label, children }: FormFieldProps) {
  const colors = useDashboardTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

export function FormTextInput({ label, style, ...props }: FormTextInputProps) {
  const colors = useDashboardTheme();
  const styles = createStyles(colors);

  return (
    <FormField label={label}>
      <TextInput
        placeholderTextColor={colors.textSubtle}
        style={[styles.input, props.multiline && styles.textArea, style]}
        {...props}
      />
    </FormField>
  );
}

export function MoneyField({ label, value, onChangeText }: MoneyFieldProps) {
  const colors = useDashboardTheme();
  const styles = createStyles(colors);

  return (
    <FormField label={label}>
      <View style={styles.moneyInputWrap}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder="0,00"
          placeholderTextColor={colors.textSubtle}
          keyboardType="decimal-pad"
          style={[styles.input, styles.moneyInput]}
        />
        <Text style={styles.euroSuffix}>€</Text>
      </View>
    </FormField>
  );
}

export function MiniMoneyInput({
  value,
  placeholder,
  onChangeText,
}: {
  value: string;
  placeholder: string;
  onChangeText: (value: string) => void;
}) {
  const colors = useDashboardTheme();
  const styles = createStyles(colors);

  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.textSubtle}
      keyboardType="decimal-pad"
      style={styles.miniInput}
    />
  );
}

export function SegmentedControl({ children }: { children: React.ReactNode }) {
  const colors = useDashboardTheme();
  const styles = createStyles(colors);

  return <View style={styles.segmentedControl}>{children}</View>;
}

export function SegmentButton({ label, selected, onPress }: SegmentButtonProps) {
  const colors = useDashboardTheme();
  const styles = createStyles(colors);

  return (
    <Pressable style={[styles.segment, selected && styles.segmentSelected]} onPress={onPress}>
      <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>{label}</Text>
    </Pressable>
  );
}

function createStyles(colors: DashboardColors) {
  return StyleSheet.create({
    field: {
      gap: 9,
    },
    label: {
      color: colors.textMuted,
      fontSize: 14,
      fontWeight: '900',
    },
    input: {
      backgroundColor: colors.card,
      borderRadius: 20,
      color: colors.text,
      fontSize: 17,
      fontWeight: '800',
      minHeight: 56,
      paddingHorizontal: 16,
    },
    textArea: {
      minHeight: 100,
      paddingTop: 16,
      textAlignVertical: 'top',
    },
    moneyInputWrap: {
      position: 'relative',
    },
    moneyInput: {
      paddingRight: 48,
    },
    euroSuffix: {
      color: colors.textMuted,
      fontSize: 17,
      fontWeight: '900',
      position: 'absolute',
      right: 18,
      top: 17,
    },
    miniInput: {
      backgroundColor: colors.cardMuted,
      borderRadius: 15,
      color: colors.text,
      flex: 1,
      fontSize: 14,
      fontWeight: '800',
      minHeight: 46,
      paddingHorizontal: 12,
    },
    segmentedControl: {
      backgroundColor: colors.cardMuted,
      borderRadius: 18,
      flexDirection: 'row',
      padding: 4,
    },
    segment: {
      alignItems: 'center',
      borderRadius: 14,
      flex: 1,
      justifyContent: 'center',
      minHeight: 42,
    },
    segmentSelected: {
      backgroundColor: colors.card,
    },
    segmentText: {
      color: colors.textMuted,
      fontSize: 14,
      fontWeight: '900',
    },
    segmentTextSelected: {
      color: colors.text,
    },
  });
}

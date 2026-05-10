import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

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
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

export function FormTextInput({ label, style, ...props }: FormTextInputProps) {
  return (
    <FormField label={label}>
      <TextInput
        placeholderTextColor="#A0A8B3"
        style={[styles.input, props.multiline && styles.textArea, style]}
        {...props}
      />
    </FormField>
  );
}

export function MoneyField({ label, value, onChangeText }: MoneyFieldProps) {
  return (
    <FormField label={label}>
      <View style={styles.moneyInputWrap}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder="0,00"
          placeholderTextColor="#A0A8B3"
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
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#A0A8B3"
      keyboardType="decimal-pad"
      style={styles.miniInput}
    />
  );
}

export function SegmentedControl({ children }: { children: React.ReactNode }) {
  return <View style={styles.segmentedControl}>{children}</View>;
}

export function SegmentButton({ label, selected, onPress }: SegmentButtonProps) {
  return (
    <Pressable style={[styles.segment, selected && styles.segmentSelected]} onPress={onPress}>
      <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: 9,
  },
  label: {
    color: '#344054',
    fontSize: 14,
    fontWeight: '900',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    color: '#111827',
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
    color: '#667085',
    fontSize: 17,
    fontWeight: '900',
    position: 'absolute',
    right: 18,
    top: 17,
  },
  miniInput: {
    backgroundColor: '#F4F6F5',
    borderRadius: 15,
    color: '#111827',
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    minHeight: 46,
    paddingHorizontal: 12,
  },
  segmentedControl: {
    backgroundColor: '#EDEFF1',
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
    backgroundColor: '#FFFFFF',
  },
  segmentText: {
    color: '#667085',
    fontSize: 14,
    fontWeight: '900',
  },
  segmentTextSelected: {
    color: '#111827',
  },
});

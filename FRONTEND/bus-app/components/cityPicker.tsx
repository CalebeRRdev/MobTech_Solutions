import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  TextInput as RNTextInput,
  TextInput,
  FlatList,
  TouchableOpacity,
  Text,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';

// Opções de cidades (labels finais mostradas no UI)
const CITY_OPTIONS = ['Anápolis', 'Goiânia', 'Brasília'] as const;
type CityLabel = (typeof CITY_OPTIONS)[number];

// normaliza para busca (sem acento/maiúscula)
function normalize(s: string) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

// aliases aceitos -> label final
const ALIASES: Record<string, CityLabel> = {
  anapolis: 'Anápolis',
  anápolis: 'Anápolis',
  goiania: 'Goiânia',
  goiânia: 'Goiânia',
  brasilia: 'Brasília',
  brasília: 'Brasília',
};

type CityPickerProps = {
  placeholder: string;
  value: string;                       // valor controlado pelo pai (string simples)
  onChange: (val: string) => void;     // atualiza no pai
  exclude?: string | null;             // oculta esta cidade no dropdown
  inputStyle?: StyleProp<TextStyle>;   // <- corrigido: aceita StyleProp
  containerStyle?: StyleProp<ViewStyle>; // <- corrigido: aceita StyleProp (array ok)
};

export default function CityPicker({
  placeholder,
  value,
  onChange,
  exclude,
  inputStyle,
  containerStyle,
}: CityPickerProps) {
  // estado local para digitação e controle de dropdown
  const [text, setText] = useState<string>('');
  const inputRef = useRef<RNTextInput | null>(null);

  // qual "texto base" exibir no input (valor do pai ou o que está digitando)
  const inputValue = value || text;

  // opções filtradas (esconde exclude e busca por texto digitado)
  const options = useMemo(() => {
    const q = normalize(text);
    const base = exclude
      ? CITY_OPTIONS.filter((c) => c !== exclude)
      : CITY_OPTIONS.slice();
    if (!q) return [];
    return base.filter((c) => normalize(c).includes(q));
  }, [text, exclude]);

  // dropdown aparece só quando está digitando algo e há resultado
  const showDropdown = text.trim().length > 0 && options.length > 0;

  function commitFromText(t: string) {
    const key = normalize(t);
    const match = ALIASES[key];
    if (match && match !== exclude) {
      onChange(match);
      setText('');
    }
  }

  return (
    <View style={[styles.wrapper, containerStyle]}>
      <TextInput
        ref={inputRef}
        style={[styles.input, inputStyle]}
        placeholder={placeholder}
        value={inputValue}
        onChangeText={(t) => {
          setText(t);
          onChange(''); // limpamos o valor “fixo” do pai enquanto digita, para habilitar o dropdown
        }}
        onBlur={() => {
          if (!value) commitFromText(text);
        }}
        autoCorrect={false}
        autoCapitalize="none"
      />

      {showDropdown && (
        <FlatList
          keyboardShouldPersistTaps="handled"
          data={options}
          keyExtractor={(c) => c}
          style={styles.dropdown}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.option}
              onPress={() => {
                onChange(item);      // fixa no pai
                setText('');         // limpa digitação
                inputRef.current?.blur(); // fecha teclado e dropdown
              }}
            >
              <Text style={styles.optionText}>{item}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // vira contêiner de posicionamento do dropdown
  wrapper: {
    width: '100%',
    marginBottom: 16,
    position: 'relative',
  },
  input: {
    height: 48,              // visual idêntico aos seus inputs
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D9D9D9',
    paddingHorizontal: 14,
    fontSize: 18,
  },
  // dropdown ABSOLUTO logo abaixo do input
  dropdown: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 54,                 // ~altura do input (48) + margemzinha
    backgroundColor: '#fff',
    borderRadius: 10,
    maxHeight: 160,
    zIndex: 100,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  option: {
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  optionText: { fontSize: 16 },
});
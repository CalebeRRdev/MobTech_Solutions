import React from 'react';
import { View, StyleSheet } from 'react-native';
import CityPicker from './cityPicker';

interface SearchFormProps {
  origem: string;
  destino: string;
  setOrigem: (value: string) => void;
  setDestino: (value: string) => void;
}

const SearchForm: React.FC<SearchFormProps> = ({
  origem,
  destino,
  setOrigem,
  setDestino,
}) => {
  return (
    <View style={styles.wrapper}>
      {/* Campo ORIGEM (z-index maior para sobrepor o de baixo quando aberto) */}
      <View style={styles.rowTop}>
        <CityPicker
          placeholder="Origem"
          value={origem}
          onChange={setOrigem}
          exclude={destino || null}
          inputStyle={styles.input}       // mantém o visual original
          containerStyle={styles.field}   // permite passar arrays sem erro
        />
      </View>

      {/* Campo DESTINO */}
      <View style={styles.rowBottom}>
        <CityPicker
          placeholder="Destino"
          value={destino}
          onChange={setDestino}
          exclude={origem || null}
          inputStyle={styles.input}
          containerStyle={[styles.field, { marginTop: 12 }]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // precisa permitir o dropdown “passar” por cima do botão abaixo
  wrapper: {
    width: '90%',
    alignSelf: 'center',
    overflow: 'visible',
    position: 'relative',
    zIndex: 50,
  },
  field: {
    // espaço entre campos controlado a partir daqui
  },
  input: {
    height: 48,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D9D9D9',
    paddingHorizontal: 14,
    fontSize: 18,
  },
  rowTop: {
    zIndex: 60, // acima do de baixo
  },
  rowBottom: {
    zIndex: 55,
  },
});

export default SearchForm;
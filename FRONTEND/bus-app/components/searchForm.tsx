import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';

// Tipagem para as props do componente
interface SearchFormProps {
  origem: string;           // Valor atual da origem
  destino: string;          // Valor atual do destino
  setOrigem: (value: string) => void; // Função para atualizar origem
  setDestino: (value: string) => void; // Função para atualizar destino
}

// Componente SearchForm
const SearchForm: React.FC<SearchFormProps> = ({ origem, destino, setOrigem, setDestino }) => {
  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Origem (ex.: My location)"
        value={origem}
        onChangeText={setOrigem}
        accessible
        accessibilityLabel="Campo de origem"
      />
      <TextInput
        style={styles.input}
        placeholder="Destino (ex.: Goiânia)"
        value={destino}
        onChangeText={setDestino}
        accessible
        accessibilityLabel="Campo de destino"
      />
    </View>
  );
};

// Estilo dos inputs de origem e destino
const styles = StyleSheet.create({
  container: {
    width: '100%',            // ocupa a largura disponível
    justifyContent: 'center', // centraliza verticalmente dentro do pai
    alignItems: 'center',     // centraliza horizontalmente dentro do pai
    marginBottom: 30,         // espaçamento abaixo do formulário
    backgroundColor: '#2B547E',
    padding: 10,
    marginTop: 10,
    elevation: 4, // sombra para Android
    shadowColor: '#000', // sombra para iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    borderRadius: 20,
    shadowColor: '#000', // sombra para iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
  },
  input: {
    height: 50,
    width: '90%',             // inputs não grudam na lateral
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#989898ff',
    paddingHorizontal: 16,
    marginBottom: 20,
    marginTop: 15,
    fontSize: 16,
    fontcolor: '#000000',
    // Sombra para iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    // Elevação para Android
    elevation: 2,
  },
});

export default SearchForm;

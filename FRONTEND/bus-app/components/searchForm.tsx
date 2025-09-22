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
      padding: 16, // Adiciona espaçamento interno no container
      borderWidth: 1.5,
      margin: 16, // Adiciona margin geral no container dos inputs
      borderRadius: 8,
      borderColor: '#989898ff',
    },
    input: {
      backgroundColor: '#FFFFFF',
      borderRadius: 8,
      padding: 12, // Adiciona espaçamento dentro do input
      marginBottom: 12, // Adiciona espaçamento externo em baixo dos inputs
      fontSize: 16,
    },
  });

export default SearchForm;
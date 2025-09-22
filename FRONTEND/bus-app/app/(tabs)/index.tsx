import React, { useState } from 'react';
import { Text, View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import SearchForm from '@/components/searchForm';

const HomeScreen = () => {
  const [origem, setOrigem] = useState('');
  const [destino, setDestino] = useState('');

  const validacaoCampos = () => {
    if (!origem.trim() || !destino.trim()) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos.');
      return false;
    } else {
      Alert.alert('Sucesso', 'Nova página em breve');
      return true;
    }
  };

  return (
    <View style={styles.container}>
      {/* Cabeçalho */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Olá, Bem Vindo!</Text>
      </View>

      {/* Conteúdo central */}
      <View style={styles.content}>
        <SearchForm
          origem={origem}
          destino={destino}
          setOrigem={setOrigem}
          setDestino={setDestino}
        />

        <TouchableOpacity style={styles.nextButton} onPress={validacaoCampos} accessible accessibilityLabel="Botão Pesquisar">
          <Text style={styles.nextButtonText}>Pesquisar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },

  // topo azul ocupando só a altura do título
  header: {
    backgroundColor: '#007BFF',
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginHorizontal: 10,
    elevation: 4, // sombra para Android
    shadowColor: '#000', // sombra para iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 10,
    shadowColor: '#000', // sombra para iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },

  // área centralizada (inputs + botão)
  content: {
    flex: 1,
    marginTop: 90,
    alignItems: 'center',       // centraliza horizontal
    paddingHorizontal: 16,
    marginHorizontal: 10,
    borderRadius: 20,
  },

  nextButton: {
    height: 50,
    width: '90%',               // mesma largura dos inputs
    backgroundColor: '#007BFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    marginTop: 15,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 0.5,
  },
});

export default HomeScreen;
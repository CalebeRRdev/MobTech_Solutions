import { Text, View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Link } from 'expo-router';

import React, { useState } from 'react';
import SearchForm from '@/components/searchForm';

// Função como arrow function que recebe dados de origem e destino da viagem
const HomeScreen = () => {
    const [origem, setOrigem] = useState('');
    const [destino, setDestino] = useState('');

    // Função verificar se os dois campos estão preenchidos
    const validacaoCampos = () => {
      if (!origem.trim() || !destino.trim()) {
        Alert.alert('erro', 'Por favor preencha todos os campos');
        return false
      } else {
        Alert.alert('Sucesso', 'Nova página em breve')
        return true
      }
    } 

    
    // const irParaProximo = () => {
    //   if (validacaoCampos()) {
    //     Alert.alert('Sucesso', 'Nova página em breve')
    //   }
    // }

    return (
      <View style={ styles.container }>
        <Text style={styles.greeting}>Olá, Wesley!</Text>
        <SearchForm
          origem={origem}
          destino={destino}
          setOrigem={setOrigem}
          setDestino={setDestino}
        />
        <TouchableOpacity style={styles.nextButton} onPress={validacaoCampos}>
          <Text style={styles.nextButtonText}>Próximo</Text>
        </TouchableOpacity>
      </View>
    );
};

const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    greeting: {
      padding: 8,
      fontSize: 28,
      fontWeight: 'bold',
      color: '#FFFFFF', // Branco para contrastar com o fundo azul
      marginBottom: 16, // Espaçamento abaixo da saudação
      backgroundColor: '#007BFF',
  },
  nextButton: {
    backgroundColor: '#007BFF',
    alignItems: 'center',
    marginLeft: 16,
    marginRight: 16,
    padding: 8,
    borderRadius: 8
  },
  nextButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  }
});

export default HomeScreen
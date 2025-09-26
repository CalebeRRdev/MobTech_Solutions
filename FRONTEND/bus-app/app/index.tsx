import React, { useState } from 'react';
import { Text, View, StyleSheet, TouchableOpacity, StatusBar, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import SearchForm from '@/components/searchForm';

export default function HomeScreen() {
  const [origem, setOrigem] = useState('');
  const [destino, setDestino] = useState('');
  const router = useRouter();

  const onAcompanhar = () => {
    if (!origem.trim() || !destino.trim()) {
      Alert.alert('Campos obrigatórios', 'Preencha origem e destino para continuar.');
      return;
    }
    // navega para a tela do mapa
    router.push({ pathname: '/map', params: { origem, destino } });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Text style={styles.brand}>MobTech Solutions</Text>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.center}>
        <Text style={styles.title}>Acompanhe a{'\n'}sua viagem</Text>

        <SearchForm origem={origem} destino={destino} setOrigem={setOrigem} setDestino={setDestino} />

        <TouchableOpacity style={styles.cta} onPress={onAcompanhar} accessibilityLabel="Acompanhar viagem">
          <Text style={styles.ctaText}>Acompanhar</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#012d81', paddingHorizontal: 20, paddingTop: 24 },
  brand: { color: '#FFFFFF', textAlign: 'center', fontSize: 24, fontWeight: '600', marginTop: -30 },
  center: { flex: 1, justifyContent: 'center' },
  title: {
    color: '#FFFFFF',
    fontSize: 45,
    lineHeight: 50,
    fontWeight: '600',
    marginBottom: 50,
    textAlign: 'center',
    marginTop: -240,
  },
  cta: {
    height: 48,
    width: '90%',
    alignSelf: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: '#164caa',
    marginTop: 30,
    alignItems: 'center',
  },
  ctaText: { color: '#FFFFFF', fontWeight: '700', fontSize: 20 },
});
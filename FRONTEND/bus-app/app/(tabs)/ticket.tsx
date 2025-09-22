import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Platform, Alert, Pressable } from 'react-native';
import { AppleMaps, GoogleMaps } from 'expo-maps';
import * as Location from 'expo-location';

type LatLng = { latitude: number; longitude: number };

export default function TicketScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const watcherRef = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setHasPermission(false);
          Alert.alert(
            'Permissão necessária',
            'Autorize o acesso à localização para exibirmos sua posição no mapa.'
          );
          return;
        }
        setHasPermission(true);

        // 1) Tenta a última posição conhecida (rápido)
        const last = await Location.getLastKnownPositionAsync({});
        if (last?.coords) {
          setUserLocation({ latitude: last.coords.latitude, longitude: last.coords.longitude });
        }

        // 2) Força uma leitura ativa (evita ficar preso em SF)
        try {
          const current = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
          setUserLocation({
            latitude: current.coords.latitude,
            longitude: current.coords.longitude,
          });
        } catch (e) {
          // Se o simulador não tem feed de localização, esta chamada pode demorar/falhar.
          // Nesse caso, use Features → Location no Simulator e toque "Centralizar em mim".
          console.warn('getCurrentPositionAsync falhou:', e);
        }

        // 3) Acompanhar em tempo real (quando houver movimento)
        watcherRef.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            distanceInterval: 5,
            timeInterval: 2000,
          },
          (pos) => {
            setUserLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
          }
        );
      } catch (e) {
        console.warn(e);
        setHasPermission(false);
      }
    })();

    return () => watcherRef.current?.remove();
  }, []);

  const camera = useMemo(() => {
    if (!userLocation) return undefined;
    return {
      center: { latitude: userLocation.latitude, longitude: userLocation.longitude },
      zoom: 15,
      pitch: 0,
      heading: 0,
    };
  }, [userLocation]);

  const recenter = async () => {
    try {
      const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setUserLocation({
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      });
    } catch (e) {
      Alert.alert(
        'Sem localização',
        'No simulador, escolha Features → Location para definir uma posição.'
      );
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.info}>Solicitando permissão de localização…</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.center}>
        <Text style={styles.warn}>
          Permissão de localização negada. Vá em Ajustes/Configurações e habilite para continuar.
        </Text>
      </View>
    );
  }

  if (!userLocation) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.info}>
          Obtendo sua localização… (no simulador, defina em Features → Location)
        </Text>
      </View>
    );
  }

  // iOS
  if (Platform.OS === 'ios') {
    return (
      <View style={{ flex: 1 }}>
        <AppleMaps.View style={{ flex: 1 }} camera={camera} />
        <Pressable style={styles.fab} onPress={recenter} accessibilityLabel="Centralizar em mim">
          <Text style={styles.fabText}>🎯</Text>
        </Pressable>
      </View>
    );
  }

  // Android
  if (Platform.OS === 'android') {
    return (
      <View style={{ flex: 1 }}>
        <GoogleMaps.View style={{ flex: 1 }} camera={camera} showsUserLocation myLocationEnabled />
        <Pressable style={styles.fab} onPress={recenter} accessibilityLabel="Centralizar em mim">
          <Text style={styles.fabText}>🎯</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.center}>
      <Text style={styles.info}>Mapas disponíveis apenas no Android/iOS.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  info: { marginTop: 10, color: '#444', textAlign: 'center' },
  warn: { color: '#d9534f', textAlign: 'center', paddingHorizontal: 24 },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#007BFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  fabText: { color: '#fff', fontSize: 24, marginTop: -2 },
});
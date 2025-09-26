import React, { useEffect, useRef, useState, useMemo } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Alert, Pressable, Platform } from 'react-native';
import MapView, { Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { useLocalSearchParams } from 'expo-router';

type LatLng = { latitude: number; longitude: number };

export default function MapScreen() {
  const { origem, destino } = useLocalSearchParams<{ origem?: string; destino?: string }>();
  const mapRef = useRef<MapView | null>(null);

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    let sub: Location.LocationSubscription | null = null;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setHasPermission(false);
          return;
        }
        setHasPermission(true);

        const last = await Location.getLastKnownPositionAsync({});
        if (last?.coords) {
          setUserLocation({ latitude: last.coords.latitude, longitude: last.coords.longitude });
        }

        try {
          const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
          setUserLocation({ latitude: current.coords.latitude, longitude: current.coords.longitude });
        } catch (e) {
          console.warn('getCurrentPositionAsync falhou:', e);
        }

        sub = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, distanceInterval: 5, timeInterval: 2000 },
          (pos) => setUserLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude })
        );
      } catch (e) {
        console.warn(e);
        setHasPermission(false);
      }
    })();

    return () => sub?.remove();
  }, []);

  const initialRegion: Region | undefined = useMemo(() => {
    if (!userLocation) return undefined;
    return {
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
      latitudeDelta: 0.012,
      longitudeDelta: 0.012,
    };
  }, [userLocation]);

  const recenter = async () => {
    try {
      const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const region: Region = {
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
        latitudeDelta: 0.012,
        longitudeDelta: 0.012,
      };
      mapRef.current?.animateToRegion(region, 800);
    } catch {
      Alert.alert(
        'Sem localização',
        Platform.OS === 'ios'
          ? 'No simulador, use Features → Location para definir uma posição.'
          : 'Ative o GPS / localização para continuar.'
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
        <Text style={styles.warn}>Permissão de localização negada. Vá em Ajustes e habilite para continuar.</Text>
      </View>
    );
  }
  if (!initialRegion) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.info}>Obtendo sua localização…</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        initialRegion={initialRegion}
        showsUserLocation
        onMapReady={() => setMapReady(true)}
      />
      {mapReady && (
        <Pressable style={styles.fab} onPress={recenter} accessibilityLabel="Centralizar em mim">
          <Text style={styles.fabText}>📍</Text>
        </Pressable>
      )}
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
    backgroundColor: '#FFFFFFFF',
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
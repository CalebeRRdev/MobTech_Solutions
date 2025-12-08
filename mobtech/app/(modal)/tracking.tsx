// app/(modal)/tracking.tsx
import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import api from '../../service/api';
import { ENDPOINTS } from '../../service/endpoints';

interface OnibusData {
  onibus_id: number;
  placa: string;
  linha: string;
  numero_linha: string;
  latitude: number;
  longitude: number;
  timestamp_atualizacao?: string;
}

export default function TrackingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { lineNumber } = params as { lineNumber?: string };

  const numerosLinha = useMemo(
    () =>
      lineNumber
        ? lineNumber.toString().split(',').map((n) => n.trim())
        : [],
    [lineNumber]
  );

  const [loading, setLoading] = useState(true);
  const [bus, setBus] = useState<OnibusData | null>(null);
  const [region, setRegion] = useState<Region | null>(null);

  // Busca periódica da posição do ônibus
  useEffect(() => {
    const fetchBus = async () => {
      try {
        const res = await api.get(ENDPOINTS.LOCALIZACAO_ONIBUS);
        const buses: OnibusData[] = Array.isArray(res.data)
          ? res.data
          : [res.data];

        const match = buses.find((b) =>
          numerosLinha.includes(b.numero_linha)
        );

        if (match) {
          setBus(match);

          if (!region) {
            setRegion({
              latitude: match.latitude,
              longitude: match.longitude,
              latitudeDelta: 0.02,
              longitudeDelta: 0.02,
            });
          } else {
            setRegion((prev) =>
              prev
                ? {
                    ...prev,
                    latitude: match.latitude,
                    longitude: match.longitude,
                  }
                : {
                    latitude: match.latitude,
                    longitude: match.longitude,
                    latitudeDelta: 0.02,
                    longitudeDelta: 0.02,
                  }
            );
          }
        } else {
          setBus(null);
        }
      } catch (error) {
        console.error('Erro ao buscar localizacaoOnibus:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBus();
    const interval = setInterval(fetchBus, 5000);
    return () => clearInterval(interval);
  }, [JSON.stringify(numerosLinha)]);

  const tituloLinha =
    numerosLinha.length === 0
      ? 'Linha não informada'
      : `Linha ${numerosLinha.join(' / ')}`;

  // Estados de carregamento / sem dados
  if (loading && !bus) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Carregando posição do ônibus...</Text>
      </View>
    );
  }

  if (!bus || !region) {
    return (
      <View style={styles.centerContainer}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>

        <Text style={styles.title}>Acompanhar o ônibus</Text>
        <Text style={styles.subtitle}>{tituloLinha}</Text>
        <Text style={[styles.subtitle, { marginTop: 12 }]}>
          Ainda não recebemos nenhuma posição para esta linha.{"\n"}
          Verifique se o simulador está rodando para o ônibus da linha
          informada.
        </Text>
      </View>
    );
  }

  // Tela com mapa
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={{ marginLeft: 12 }}>
          <Text style={styles.headerTitle}>Acompanhar o ônibus</Text>
          <Text style={styles.headerSubtitle}>{tituloLinha}</Text>
        </View>
      </View>

      {/* Mapa */}
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        region={region}
      >
        <Marker
          coordinate={{
            latitude: bus.latitude,
            longitude: bus.longitude,
          }}
          anchor={{ x: 0.5, y: 0.5 }}
        >
          <View style={styles.busMarkerContainer}>
            <Ionicons name="bus" size={20} color="#fff" />
          </View>
        </Marker>
      </MapView>

      {/* Card de informações */}
      <View style={styles.infoCard}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="bus" size={22} color={COLORS.primary} />
          <View style={{ marginLeft: 10 }}>
            <Text style={styles.infoTitle}>{tituloLinha}</Text>
            <Text style={styles.infoSubtitle}>Placa: {bus.placa}</Text>
          </View>
        </View>

        {bus.timestamp_atualizacao && (
          <Text style={styles.infoFooter}>
            Última atualização:{' '}
            {new Date(bus.timestamp_atualizacao).toLocaleTimeString()}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 70 : 16,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },

  map: { flex: 1 },

  busMarkerContainer: {
    backgroundColor: COLORS.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    elevation: 5,
  },

  infoCard: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
  },
  infoTitle: { fontSize: 16, fontWeight: '700', color: '#111' },
  infoSubtitle: { fontSize: 13, color: '#555', marginTop: 2 },
  infoFooter: { fontSize: 11, color: '#777', marginTop: 10 },

  centerContainer: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 52 : 24,
    left: 16,
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 20,
    elevation: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
});
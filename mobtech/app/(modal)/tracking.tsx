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
import MapView, {
  Marker,
  PROVIDER_GOOGLE,
  Region,
  Polyline,
} from 'react-native-maps';
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

interface LinhaResumo {
  id: number;
  numero: string;
  nome: string;
}

interface ParadaApi {
  id: number;
  nome: string;
  localizacao: {
    type: string;
    coordinates: [number, number]; // [lng, lat]
  };
  LinhaParada: {
    sequencia: number;
    sentido: string;
  };
}

type Coord = { latitude: number; longitude: number };

const isIOS = Platform.OS === 'ios';

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

  const [routeCoords, setRouteCoords] = useState<Coord[]>([]);
  const [pastRoute, setPastRoute] = useState<Coord[]>([]);
  const [futureRoute, setFutureRoute] = useState<Coord[]>([]);

  // 1) Carrega a rota da linha (lista de paradas) para desenhar o trajeto
  useEffect(() => {
    const loadRoute = async () => {
      try {
        if (!numerosLinha.length) return;

        // Buscar todas as linhas
        const linhasRes = await api.get<LinhaResumo[]>(ENDPOINTS.LINHAS);
        const linhas = linhasRes.data || [];

        // Pegar só a primeira linha (ex: "2")
        const linhaNumeroBase = numerosLinha[0];
        const linhaInfo = linhas.find((l) => l.numero === linhaNumeroBase);

        if (!linhaInfo) {
          console.warn(
            `Linha com número ${linhaNumeroBase} não encontrada em /linhas`
          );
          return;
        }

        // Buscar paradas dessa linha
        const paradasRes = await api.get(ENDPOINTS.LINHA_PARADAS(linhaInfo.id));
        const rawParadas: ParadaApi[] = paradasRes.data.linha?.paradas || [];

        // Filtrar paradas válidas e ordenar por sequencia
        const coords: Coord[] = rawParadas
          .filter((p) => p.localizacao && p.localizacao.coordinates)
          .sort(
            (a, b) =>
              (a.LinhaParada?.sequencia ?? 0) -
              (b.LinhaParada?.sequencia ?? 0)
          )
          .map((p) => ({
            latitude: p.localizacao.coordinates[1],
            longitude: p.localizacao.coordinates[0],
          }));

        setRouteCoords(coords);
      } catch (err) {
        console.error('Erro ao carregar rota da linha para tracking:', err);
      }
    };

    loadRoute();
  }, [JSON.stringify(numerosLinha)]);

  // 2) Busca periódica da posição do ônibus
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

          // Atualiza região do mapa para seguir o ônibus
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

  // 3) Divide rota em trecho percorrido (cinza) e futuro (azul/verde-água)
  useEffect(() => {
    if (!bus || routeCoords.length < 2) return;

    const sqDist = (a: Coord, b: { latitude: number; longitude: number }) => {
      const dLat = a.latitude - b.latitude;
      const dLng = a.longitude - b.longitude;
      return dLat * dLat + dLng * dLng;
    };

    // Verifica se o ônibus está mais perto do início ou do fim da rota
    const first = routeCoords[0];
    const last = routeCoords[routeCoords.length - 1];
    const distToFirst = sqDist(first, bus);
    const distToLast = sqDist(last, bus);

    let ordered = routeCoords;
    let reversed = false;

    // Se estiver mais perto do fim, invertemos a rota para tratar esse "lado" como futuro
    if (distToLast < distToFirst) {
      ordered = [...routeCoords].reverse();
      reversed = true;
    }

    // Acha o ponto da rota mais próximo do ônibus na ordem escolhida
    let closestIdx = 0;
    let minDist = Infinity;

    ordered.forEach((pt, idx) => {
      const d = sqDist(pt, bus);
      if (d < minDist) {
        minDist = d;
        closestIdx = idx;
      }
    });

    const pastOrdered = ordered.slice(0, closestIdx + 1);
    const futureOrdered = ordered.slice(closestIdx);

    // Se a rota foi invertida, voltamos tudo pro sentido original
    if (reversed) {
      setPastRoute(pastOrdered.reverse());
      setFutureRoute(futureOrdered.reverse());
    } else {
      setPastRoute(pastOrdered);
      setFutureRoute(futureOrdered);
    }
  }, [bus, JSON.stringify(routeCoords)]);

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
          Ainda não recebemos nenhuma posição para esta linha.{'\n'}
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
        {/* Trecho já percorrido (cinza claro) */}
        {pastRoute.length > 1 && (
          <Polyline
            coordinates={pastRoute}
            strokeColor={isIOS ? undefined : '#999999'}
            strokeColors={
              isIOS ? pastRoute.map(() => '#999999') : undefined
            }
            strokeWidth={4}
            lineCap="round"
            lineJoin="round"
            zIndex={1}
          />
        )}

        {/* Trecho futuro (azul / verde-água do app) */}
        {futureRoute.length > 1 && (
          <Polyline
            coordinates={futureRoute}
            strokeColor={isIOS ? undefined : COLORS.primary}
            strokeColors={
              isIOS ? futureRoute.map(() => COLORS.primary) : undefined
            }
            strokeWidth={6}
            lineCap="round"
            lineJoin="round"
            zIndex={2}
          />
        )}

        {/* Marcador do ônibus */}
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
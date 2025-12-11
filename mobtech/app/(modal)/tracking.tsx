// app/(modal)/tracking.tsx
import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  Alert,
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
import * as Location from 'expo-location';
import FloatingActionButton from '../../components/map/FloatingActionButton';

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

// para as setas de direção ao longo da rota
type ArrowPoint = {
  latitude: number;
  longitude: number;
  angleRad: number;
};

const buildArrows = (coords: Coord[], step: number = 8): ArrowPoint[] => {
  const arrows: ArrowPoint[] = [];
  if (!coords || coords.length < 2) return arrows;

  for (let i = 0; i < coords.length - 1; i += step) {
    const start = coords[i];
    const end = coords[i + 1];

    const midLat = (start.latitude + end.latitude) / 2;
    const midLng = (start.longitude + end.longitude) / 2;

    const angleRad = Math.atan2(
      end.latitude - start.latitude,
      end.longitude - start.longitude
    );

    arrows.push({
      latitude: midLat,
      longitude: midLng,
      angleRad,
    });
  }

  return arrows;
};

const isIOS = Platform.OS === 'ios';

// Azul estilo navegação do Google Maps (trajeto futuro)
const NAV_BLUE = '#1A73E8';

// Cinza claro para trecho já percorrido
const NAV_BLUE_PAST = '#999999';

export default function TrackingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const {
    lineNumber,
    lineName,
    originLat,
    originLng,
    destLat,
    destLng,
  } = params as {
    lineNumber?: string;
    lineName?: string;
    originLat?: string | number;
    originLng?: string | number;
    destLat?: string | number;
    destLng?: string | number;
  };

  const numerosLinha = useMemo(
    () =>
      lineNumber
        ? lineNumber.toString().split(',').map((n) => n.trim())
        : [],
    [lineNumber]
  );

  // destino (pino vermelho)
  const destinationCoord: Coord | null = useMemo(() => {
    if (destLat == null || destLng == null) return null;
    const latitude = parseFloat(String(destLat));
    const longitude = parseFloat(String(destLng));
    if (isNaN(latitude) || isNaN(longitude)) return null;
    return { latitude, longitude };
  }, [destLat, destLng]);

  const [loading, setLoading] = useState(true);
  const [bus, setBus] = useState<OnibusData | null>(null);
  const [region, setRegion] = useState<Region | null>(null);

  const [routeCoords, setRouteCoords] = useState<Coord[]>([]);
  const [pastRoute, setPastRoute] = useState<Coord[]>([]);
  const [futureRoute, setFutureRoute] = useState<Coord[]>([]);

  // localização atual do usuário
  const [userLocation, setUserLocation] = useState<Coord | null>(null);
  const locationSubRef = useRef<Location.LocationSubscription | null>(null);

  // ref do mapa para animar câmera
  const mapRef = useRef<MapView | null>(null);

  // setas ao longo da rota futura (para indicar sentido do ônibus)
  const arrowsFutureRoute = useMemo(
    () => buildArrows(futureRoute, 10),
    [futureRoute]
  );

  // 1) Carrega a rota da linha (lista de paradas) para desenhar o trajeto
  useEffect(() => {
    const loadRoute = async () => {
      try {
        if (!numerosLinha.length) return;

        const linhasRes = await api.get<LinhaResumo[]>(ENDPOINTS.LINHAS);
        const linhas = linhasRes.data || [];

        const linhaNumeroBase = numerosLinha[0];
        const linhaInfo = linhas.find((l) => l.numero === linhaNumeroBase);

        if (!linhaInfo) {
          console.warn(
            `Linha com número ${linhaNumeroBase} não encontrada em /linhas`
          );
          return;
        }

        const paradasRes = await api.get(ENDPOINTS.LINHA_PARADAS(linhaInfo.id));
        const rawParadas: ParadaApi[] = paradasRes.data.linha?.paradas || [];

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

  // 2) Inicia acompanhamento da localização do usuário
  useEffect(() => {
    const startLocationUpdates = async () => {
      try {
        const { status } =
          await Location.requestForegroundPermissionsAsync();

        if (status !== 'granted') {
          console.warn('Permissão de localização negada para tracking');
          return;
        }

        const loc = await Location.getCurrentPositionAsync({});
        const coord: Coord = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        };
        setUserLocation(coord);

        locationSubRef.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Highest,
            timeInterval: 2500,
            distanceInterval: 5,
          },
          (loc) => {
            const c: Coord = {
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
            };
            setUserLocation(c);
          }
        );
      } catch (error) {
        console.error('Erro ao iniciar localização do usuário no tracking:', error);
      }
    };

    startLocationUpdates();

    return () => {
      if (locationSubRef.current) {
        locationSubRef.current.remove();
      }
    };
  }, []);

  // 2.1) Botão: centralizar mapa no usuário
  const centerMapOnUser = async () => {
    try {
      if (!mapRef.current) return;

      let { status } = await Location.getForegroundPermissionsAsync();

      if (status !== Location.PermissionStatus.GRANTED) {
        const req = await Location.requestForegroundPermissionsAsync();
        status = req.status;
      }

      if (status !== Location.PermissionStatus.GRANTED) {
        Alert.alert(
          'Localização desativada',
          'Ative a permissão de localização do aplicativo para usar o mapa em tempo real.'
        );
        return;
      }

      let coord = userLocation;

      if (!coord) {
        const last = await Location.getLastKnownPositionAsync();
        if (last) {
          coord = {
            latitude: last.coords.latitude,
            longitude: last.coords.longitude,
          };
        }
      }

      if (!coord) {
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        coord = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
      }

      if (!coord) return;

      mapRef.current.animateCamera(
        {
          center: coord,
          zoom: 17,
        },
        { duration: 800 }
      );
    } catch (err) {
      console.log('[centerMapOnUser] erro ao obter localização:', err);
      Alert.alert(
        'Localização',
        'Não foi possível obter sua localização agora.'
      );
    }
  };

  // 2.2) Botão: centralizar mapa no ônibus
  const centerMapOnBus = () => {
    try {
      if (!mapRef.current || !bus) {
        Alert.alert(
          'Localização do ônibus',
          'Ainda não temos a posição do ônibus para centralizar o mapa.'
        );
        return;
      }

      mapRef.current.animateCamera(
        {
          center: {
            latitude: bus.latitude,
            longitude: bus.longitude,
          },
          zoom: 17,
        },
        { duration: 800 }
      );
    } catch (err) {
      console.log('[centerMapOnBus] erro ao centralizar no ônibus:', err);
    }
  };

  // 3) Busca periódica da posição do ônibus
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

  // 4) Define a região do mapa apenas uma vez
  useEffect(() => {
    if (region) return;
    if (!bus && !userLocation) return;

    const basePoint: Coord | null = userLocation
      ? userLocation
      : bus
      ? { latitude: bus.latitude, longitude: bus.longitude }
      : null;

    if (!basePoint) return;

    setRegion({
      latitude: basePoint.latitude,
      longitude: basePoint.longitude,
      latitudeDelta: 0.006,
      longitudeDelta: 0.006,
    });
  }, [bus, userLocation, region]);

  // 5) Divide rota em trecho percorrido (cinza) e futuro (azul),
  // projetando o ônibus no segmento MAIS PRÓXIMO da rota
  useEffect(() => {
    if (!bus || routeCoords.length < 2) return;

    const busCoord: Coord = {
      latitude: bus.latitude,
      longitude: bus.longitude,
    };

    const sqDist = (a: Coord, b: Coord) => {
      const dLat = a.latitude - b.latitude;
      const dLng = a.longitude - b.longitude;
      return dLat * dLat + dLng * dLng;
    };

    // Projeta um ponto P no segmento AB e retorna o ponto projetado e o parâmetro t (0..1)
    const projectOnSegment = (p: Coord, a: Coord, b: Coord) => {
      const abLat = b.latitude - a.latitude;
      const abLng = b.longitude - a.longitude;
      const apLat = p.latitude - a.latitude;
      const apLng = p.longitude - a.longitude;

      const ab2 = abLat * abLat + abLng * abLng;
      if (ab2 === 0) {
        return { point: a, t: 0 };
      }

      let t = (apLat * abLat + apLng * abLng) / ab2;
      t = Math.max(0, Math.min(1, t)); // clamp 0..1

      const proj: Coord = {
        latitude: a.latitude + t * abLat,
        longitude: a.longitude + t * abLng,
      };

      return { point: proj, t };
    };

    let bestSegIndex = 0;
    let bestPoint: Coord = routeCoords[0];
    let minDist = Infinity;

    // procura o segmento da rota mais próximo do ônibus
    for (let i = 0; i < routeCoords.length - 1; i++) {
      const a = routeCoords[i];
      const b = routeCoords[i + 1];

      const { point: proj } = projectOnSegment(busCoord, a, b);
      const d2 = sqDist(proj, busCoord);

      if (d2 < minDist) {
        minDist = d2;
        bestSegIndex = i;
        bestPoint = proj;
      }
    }

    const past = [
      ...routeCoords.slice(0, bestSegIndex + 1), // até o ponto A do segmento
      bestPoint,                                 // ponto projetado "grudado" na rua
    ];

    const future = [
      bestPoint,
      ...routeCoords.slice(bestSegIndex + 1),
    ];

    setPastRoute(past);
    setFutureRoute(future);
  }, [bus, JSON.stringify(routeCoords)]);

  const tituloLinha = (() => {
    const nums = numerosLinha.filter(Boolean);
    const numeroLabel = nums.length
      ? `Linha ${nums.join(' / ')}`
      : 'Ônibus';

    if (lineName && lineName.length > 0) {
      return `${numeroLabel} · ${lineName}`;
    }

    return numeroLabel;
  })();

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

        <Text style={styles.title}>Acompanhando o ônibus</Text>
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
          <Text style={styles.headerTitle}>Acompanhando o ônibus</Text>
          <Text style={styles.headerSubtitle}>{tituloLinha}</Text>
        </View>
      </View>

      {/* Mapa */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        region={region}
        showsUserLocation={true}
        followsUserLocation={false}
        showsMyLocationButton={false}
      >
        {pastRoute.length > 1 && (
          <Polyline
            coordinates={pastRoute}
            strokeColor={isIOS ? undefined : NAV_BLUE_PAST}
            strokeColors={
              isIOS ? pastRoute.map(() => NAV_BLUE_PAST) : undefined
            }
            strokeWidth={5}
            lineCap="round"
            lineJoin="round"
            zIndex={1}
          />
        )}

{futureRoute.length > 1 && (
  <>
    <Polyline
      coordinates={futureRoute}
      strokeColor={isIOS ? undefined : NAV_BLUE}
      strokeColors={
        isIOS ? futureRoute.map(() => NAV_BLUE) : undefined
      }
      strokeWidth={5}
      lineCap="round"
      lineJoin="round"
      zIndex={2}
    />

    {arrowsFutureRoute.map((arrow, index) => (
      <Marker
        key={`future-arrow-${index}`}
        coordinate={{
          latitude: arrow.latitude,
          longitude: arrow.longitude,
        }}
        anchor={{ x: 0.5, y: 0.5 }}
        flat
        rotation={(arrow.angleRad * 180) / Math.PI} // graus
        zIndex={3}
      >
        <Ionicons name="arrow-forward" size={12} color={NAV_BLUE} />
      </Marker>
    ))}
  </>
)}

        {destinationCoord && (
          <Marker
            coordinate={destinationCoord}
            pinColor="red"
            zIndex={4}
          />
        )}

        <Marker
          coordinate={{
            latitude: bus.latitude,
            longitude: bus.longitude,
          }}
          anchor={{ x: 0.5, y: 0.5 }}
          zIndex={5}
        >
          <View style={styles.busMarkerContainer}>
            <Ionicons name="bus" size={20} color="#fff" />
          </View>
        </Marker>
      </MapView>

      {/* Botão: centralizar no usuário */}
      <FloatingActionButton
        onPress={centerMapOnUser}
        iconName="locate"
        style={{ bottom: 110 }}
      />

      {/* Botão: centralizar no ônibus */}
      <FloatingActionButton
        onPress={centerMapOnBus}
        iconName="bus"
        style={{ bottom: 175 }} // um pouco acima do outro
      />

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
    bottom: 30,
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
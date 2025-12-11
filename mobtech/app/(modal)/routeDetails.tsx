// app/(modal)/routeDetails.tsx
import React, { useRef, useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import Constants from 'expo-constants';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import {
  GestureHandlerRootView,
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
} from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import api from '../../service/api';
import { ENDPOINTS } from '../../service/endpoints';
import FloatingActionButton from '../../components/map/FloatingActionButton';

// --- API KEY ---
const GOOGLE_MAPS_API_KEY: string =
  ((Constants.expoConfig?.extra as any)?.googleMapsApiKey as
    | string
    | undefined) ||
  ((process.env as any)?.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY as
    | string
    | undefined) ||
  '';

if (!GOOGLE_MAPS_API_KEY && __DEV__) {
  console.warn(
    '[RouteDetails] GOOGLE_MAPS_API_KEY não encontrada (extra.googleMapsApiKey ou EXPO_PUBLIC_GOOGLE_MAPS_API_KEY)'
  );
}

const HAS_DIRECTIONS_API = !!GOOGLE_MAPS_API_KEY;

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MIN_SHEET_HEIGHT = SCREEN_HEIGHT * 0.35;
const INITIAL_SHEET_HEIGHT = SCREEN_HEIGHT * 0.5;
const MAX_SHEET_HEIGHT = SCREEN_HEIGHT * 0.85;

// --- INTERFACES ---
interface Parada {
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

interface ParadaFormatada {
  id: number;
  nome: string;
  lat: number;
  lng: number;
  sequencia: number;
  passou: boolean;
  linha?: string;
}

interface OnibusData {
  onibus_id: number;
  placa: string;
  linha: string;
  numero_linha: string;
  latitude: number;
  longitude: number;
}

interface LinhaSegment {
  linha: string;
  linhaNome?: string;
  stops: ParadaFormatada[];
}

interface LinhaResumo {
  id: number;
  numero: string;
  nome: string;
}

type WalkCoord = { latitude: number; longitude: number };

type ArrowPoint = {
  latitude: number;
  longitude: number;
  angleRad: number;
};

const buildArrows = (coords: WalkCoord[], step: number = 8): ArrowPoint[] => {
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

const deg2rad = (deg: number) => deg * (Math.PI / 180);

const getDistanceFromLatLonInKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) => {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const estimateWalkMinutes = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) => {
  const distanceKm = getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2);
  const walkingSpeedKmh = 4.5;
  const minutes = (distanceKm / walkingSpeedKmh) * 60;
  return Math.max(1, Math.round(minutes));
};

const estimateBusMinutes = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) => {
  const distanceKm = getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2);
  const busSpeedKmh = 25;
  const minutes = (distanceKm / busSpeedKmh) * 60;
  return Math.max(1, Math.round(minutes));
};

const formatMinutes = (value: number | null) => {
  if (value == null) return '—';
  const rounded = Math.max(0, Math.round(value));
  return `${rounded} min`;
};

const getBearing = (from: WalkCoord, to: WalkCoord): number => {
  const lat1 = deg2rad(from.latitude);
  const lat2 = deg2rad(to.latitude);
  const dLon = deg2rad(to.longitude - from.longitude);

  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

  let brng = Math.atan2(y, x);
  brng = (brng * 180) / Math.PI;
  brng = (brng + 360) % 360;
  return brng;
};

export default function RouteDetails() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const mapRef = useRef<MapView | null>(null);
  const insets = useSafeAreaInsets();

  const {
    lineNumber,
    lineName,
    originLat,
    originLng,
    destLat,
    destLng,
    destAddress,
    routeEtaMinutes,
  } = params as any;

  if (__DEV__) {
    console.log('[RouteDetails] params:', params);
  }

  const origin = {
    latitude: parseFloat(String(originLat)),
    longitude: parseFloat(String(originLng)),
  };
  const destination = {
    latitude: parseFloat(String(destLat)),
    longitude: parseFloat(String(destLng)),
  };

  const centerMapOnOrigin = () => {
    if (!mapRef.current) return;
    if (isNaN(origin.latitude) || isNaN(origin.longitude)) return;

    mapRef.current.animateCamera(
      {
        center: {
          latitude: origin.latitude,
          longitude: origin.longitude,
        },
        zoom: 17.5,
      },
      { duration: 800 }
    );
  };

  const rawLineParam = lineNumber?.toString() ?? '';

  const linhasNumeros: string[] = rawLineParam
    .split(',')
    .map((n: string) => n.replace(/[^\d]/g, '').trim())
    .filter(Boolean);

  const displayLineLabel = linhasNumeros.length
    ? ` ${linhasNumeros.join(' / ')}`
    : rawLineParam || 'Ônibus';

  const [linhaNomePrincipal, setLinhaNomePrincipal] = useState<string | null>(
    lineName ?? null
  );

  const initialRouteEta =
    routeEtaMinutes != null && routeEtaMinutes !== ''
      ? Number(routeEtaMinutes)
      : null;

  const [loading, setLoading] = useState<boolean>(true);
  const [segments, setSegments] = useState<LinhaSegment[]>([]);
  const [onibusLocation, setOnibusLocation] = useState<OnibusData | null>(null);

  const [pontoEmbarque, setPontoEmbarque] = useState<ParadaFormatada | null>(
    null
  );
  const [pontoDesembarque, setPontoDesembarque] =
    useState<ParadaFormatada | null>(null);

  const [walkingToBoarding, setWalkingToBoarding] = useState<WalkCoord[] | null>(
    null
  );
  const [walkingToDestination, setWalkingToDestination] = useState<
    WalkCoord[] | null
  >(null);

  const [walkToBoardingMinutes, setWalkToBoardingMinutes] = useState<
    number | null
  >(null);
  const [walkToDestinationMinutes, setWalkToDestinationMinutes] = useState<
    number | null
  >(null);
  const [busTravelMinutes, setBusTravelMinutes] = useState<number | null>(null);

  const busArrivalMinutes = useMemo(() => {
    if (initialRouteEta == null) return null;
    return Math.max(0, Math.round(initialRouteEta));
  }, [initialRouteEta]);

  const waitAtStopMinutes = useMemo(() => {
    if (busArrivalMinutes == null) return null;
    return busArrivalMinutes;
  }, [busArrivalMinutes]);

  const travelAfterBoardMinutes = useMemo(() => {
    if (busTravelMinutes == null) return null;
    return Math.max(1, Math.round(busTravelMinutes));
  }, [busTravelMinutes]);

  const totalTravelMinutes = useMemo(() => {
    const parts = [
      walkToBoardingMinutes,
      waitAtStopMinutes,
      travelAfterBoardMinutes,
    ].filter((v): v is number => v != null);

    if (!parts.length) return null;
    return parts.reduce((sum, v) => sum + v, 0);
  }, [walkToBoardingMinutes, waitAtStopMinutes, travelAfterBoardMinutes]);

  const sheetHeight = useSharedValue<number>(INITIAL_SHEET_HEIGHT);
  const contextHeight = useSharedValue<number>(INITIAL_SHEET_HEIGHT);

  useEffect(() => {
    const fetchParadas = async () => {
      try {
        setLoading(true);

        if (linhasNumeros.length === 0) {
          console.warn(
            '[RouteDetails] Nenhuma linha recebida em lineNumber, não há segmentos para carregar.'
          );
          setSegments([]);
          setPontoEmbarque(null);
          setPontoDesembarque(null);
          return;
        }

        const linhasRes = await api.get<LinhaResumo[]>(ENDPOINTS.LINHAS);
        const linhas: LinhaResumo[] = linhasRes.data || [];

        if (__DEV__) {
          console.log('[RouteDetails] Linhas disponíveis:', linhas);
          console.log('[RouteDetails] linhasNumeros usados:', linhasNumeros);
        }

        const fetches = linhasNumeros.map(async (numLinha: string) => {
          const linhaInfo = linhas.find((l) => l.numero === numLinha);

          if (!linhaInfo) {
            console.warn(
              `[RouteDetails] Linha com número ${numLinha} não encontrada em /linhas`
            );
            return null;
          }

          const response = await api.get(
            ENDPOINTS.LINHA_PARADAS(linhaInfo.id)
          );
          const rawParadas: Parada[] = response.data.linha?.paradas || [];

          const formattedParadas: ParadaFormatada[] = rawParadas
            .filter((p) => p.localizacao && p.localizacao.coordinates)
            .map((p) => ({
              id: p.id,
              nome: p.nome,
              lat: p.localizacao.coordinates[1],
              lng: p.localizacao.coordinates[0],
              sequencia: p.LinhaParada?.sequencia ?? 0,
              passou: false,
              linha: numLinha,
            }))
            .sort((a, b) => a.sequencia - b.sequencia);

          return {
            linha: numLinha,
            linhaNome: linhaInfo.nome,
            stops: formattedParadas,
          } as LinhaSegment;
        });

        const resultados = await Promise.all(fetches);
        const segmentos = resultados.filter(Boolean) as LinhaSegment[];

        if (__DEV__) {
          console.log('[RouteDetails] segmentos calculados:', segmentos);
        }

        setSegments(segmentos);

        if (!linhaNomePrincipal && segmentos.length > 0) {
          setLinhaNomePrincipal(segmentos[0].linhaNome ?? null);
        }

        const flattened = segmentos.flatMap((s) => s.stops);
        if (flattened.length > 0) {
          let closestOrigin = flattened[0];
          let minOriginDist = Infinity;
          let closestDest = flattened[flattened.length - 1];
          let minDestDist = Infinity;

          flattened.forEach((p) => {
            const distToOrigin = getDistanceFromLatLonInKm(
              origin.latitude,
              origin.longitude,
              p.lat,
              p.lng
            );
            const distToDest = getDistanceFromLatLonInKm(
              destination.latitude,
              destination.longitude,
              p.lat,
              p.lng
            );

            if (distToOrigin < minOriginDist) {
              minOriginDist = distToOrigin;
              closestOrigin = p;
            }
            if (distToDest < minDestDist) {
              minDestDist = distToDest;
              closestDest = p;
            }
          });

          setPontoEmbarque(closestOrigin);
          setPontoDesembarque(closestDest);

          if (__DEV__) {
            console.log('[RouteDetails] pontoEmbarque:', closestOrigin);
            console.log('[RouteDetails] pontoDesembarque:', closestDest);
          }

          setTimeout(() => {
            if (
              mapRef.current &&
              !isNaN(origin.latitude) &&
              !isNaN(origin.longitude)
            ) {
              mapRef.current.animateCamera(
                {
                  center: {
                    latitude: origin.latitude,
                    longitude: origin.longitude,
                  },
                  zoom: 17.5,
                },
                { duration: 800 }
              );
            }
          }, 1000);
        } else {
          console.warn(
            '[RouteDetails] Nenhuma parada encontrada para as linhas informadas.'
          );
        }
      } catch (error) {
        console.error('Erro paradas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchParadas();
  }, [
    JSON.stringify(linhasNumeros),
    originLat,
    originLng,
    destLat,
    destLng,
    linhaNomePrincipal,
  ]);

  useEffect(() => {
    const updateBusStatus = async () => {
      try {
        const response = await api.get(ENDPOINTS.LOCALIZACAO_ONIBUS);
        const buses: OnibusData[] = Array.isArray(response.data)
          ? response.data
          : [response.data];

        const busesRelevant = buses.filter((b) =>
          linhasNumeros.includes(b.numero_linha)
        );
        const currentBus = busesRelevant.length > 0 ? busesRelevant[0] : null;
        setOnibusLocation(currentBus);

        setSegments((prevSegments) => {
          const updated = prevSegments.map((seg) => ({
            ...seg,
            stops: seg.stops.map((s) => ({ ...s, passou: false })),
          }));

          busesRelevant.forEach((bus) => {
            const segIndex = updated.findIndex(
              (s) => s.linha === bus.numero_linha
            );
            if (segIndex === -1) return;

            const seg = updated[segIndex];
            let closestIndex = -1;
            let minDist = Infinity;
            seg.stops.forEach((p, idx) => {
              const dist = getDistanceFromLatLonInKm(
                bus.latitude,
                bus.longitude,
                p.lat,
                p.lng
              );
              if (dist < minDist) {
                minDist = dist;
                closestIndex = idx;
              }
            });

            if (closestIndex !== -1) {
              seg.stops = seg.stops.map((s, idx) => ({
                ...s,
                passou: idx < closestIndex,
              }));
              updated[segIndex] = seg;

              for (let i = 0; i < segIndex; i++) {
                updated[i] = {
                  ...updated[i],
                  stops: updated[i].stops.map((s) => ({ ...s, passou: true })),
                };
              }
            }
          });

          return updated;
        });
      } catch (error) {
        console.error('Erro localizacaoOnibus:', error);
      }
    };

    updateBusStatus();
    const interval = setInterval(updateBusStatus, 5000);
    return () => clearInterval(interval);
  }, [JSON.stringify(linhasNumeros)]);

  useEffect(() => {
    if (!pontoEmbarque) return;

    setWalkingToBoarding((prev) => {
      if (prev && prev.length >= 2) return prev;
      return [
        { latitude: origin.latitude, longitude: origin.longitude },
        { latitude: pontoEmbarque.lat, longitude: pontoEmbarque.lng },
      ];
    });

    setWalkToBoardingMinutes((prev) => {
      if (prev != null) return prev;
      return estimateWalkMinutes(
        origin.latitude,
        origin.longitude,
        pontoEmbarque.lat,
        pontoEmbarque.lng
      );
    });
  }, [pontoEmbarque, origin.latitude, origin.longitude]);

  useEffect(() => {
    if (!pontoDesembarque) return;

    setWalkingToDestination((prev) => {
      if (prev && prev.length >= 2) return prev;
      return [
        { latitude: pontoDesembarque.lat, longitude: pontoDesembarque.lng },
        { latitude: destination.latitude, longitude: destination.longitude },
      ];
    });

    setWalkToDestinationMinutes((prev) => {
      if (prev != null) return prev;
      return estimateWalkMinutes(
        pontoDesembarque.lat,
        pontoDesembarque.lng,
        destination.latitude,
        destination.longitude
      );
    });
  }, [pontoDesembarque, destination.latitude, destination.longitude]);

  useEffect(() => {
    if (!pontoEmbarque || !pontoDesembarque) return;

    setBusTravelMinutes((prev) => {
      if (prev != null) return prev;
      return estimateBusMinutes(
        pontoEmbarque.lat,
        pontoEmbarque.lng,
        pontoDesembarque.lat,
        pontoDesembarque.lng
      );
    });
  }, [pontoEmbarque, pontoDesembarque]);

  // GESTOS DO BOTTOM SHEET
  const gestureHandler = (event: PanGestureHandlerGestureEvent) => {
    'worklet';
    let newHeight = contextHeight.value - event.nativeEvent.translationY;
    if (newHeight < MIN_SHEET_HEIGHT) newHeight = MIN_SHEET_HEIGHT;
    if (newHeight > MAX_SHEET_HEIGHT) newHeight = MAX_SHEET_HEIGHT;
    sheetHeight.value = newHeight;
  };

  const onGestureStateChange = (event: any) => {
    'worklet';
    const state = event.nativeEvent.state;

    // BEGAN
    if (state === 2) {
      contextHeight.value = sheetHeight.value;
      return;
    }

    // END ou CANCELLED -> faz snap para o ponto mais próximo
    if (state === 5 || state === 3) {
      const current = sheetHeight.value;
      const snapPoints = [
        MIN_SHEET_HEIGHT,
        INITIAL_SHEET_HEIGHT,
        MAX_SHEET_HEIGHT,
      ];

      let closest = snapPoints[0];
      let minDiff = Math.abs(current - closest);

      for (let i = 1; i < snapPoints.length; i++) {
        const diff = Math.abs(current - snapPoints[i]);
        if (diff < minDiff) {
          minDiff = diff;
          closest = snapPoints[i];
        }
      }

      sheetHeight.value = withTiming(closest, { duration: 200 });
      contextHeight.value = closest;
    }
  };

  const mapStyle = useAnimatedStyle(() => ({
    height: SCREEN_HEIGHT - sheetHeight.value,
  }));
  const sheetStyle = useAnimatedStyle(() => ({ height: sheetHeight.value }));

  const trajetoriaPorSegmento: WalkCoord[][] = useMemo(
    () =>
      segments.map((seg) =>
        seg.stops.map((s) => ({ latitude: s.lat, longitude: s.lng }))
      ),
    [segments]
  );

  const arrowsWalkingToBoarding = useMemo(
    () => buildArrows(walkingToBoarding || [], 6),
    [walkingToBoarding]
  );

  const arrowsWalkingToDestination = useMemo(
    () => buildArrows(walkingToDestination || [], 6),
    [walkingToDestination]
  );

  const arrowsBusSegments = useMemo(
    () =>
      trajetoriaPorSegmento.map((segmentCoords) =>
        buildArrows(segmentCoords, 10)
      ),
    [trajetoriaPorSegmento]
  );

  if (loading) {
    return (
      <View
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
      >
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* MAPA */}
      <Animated.View style={[styles.mapContainer, mapStyle]}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFillObject}
          provider={PROVIDER_GOOGLE}
          showsUserLocation={true}
          followsUserLocation={false}
          showsMyLocationButton={false}
          initialRegion={{
            latitude: isNaN(origin.latitude) ? -16.3286 : origin.latitude,
            longitude: isNaN(origin.longitude) ? -48.9534 : origin.longitude,
            latitudeDelta: 0.006,
            longitudeDelta: 0.006,
          }}
        >
          {/* Caminhada até o ponto */}
          {pontoEmbarque && (
            <>
              {HAS_DIRECTIONS_API && (
                <MapViewDirections
                  origin={origin}
                  destination={{
                    latitude: pontoEmbarque.lat,
                    longitude: pontoEmbarque.lng,
                  }}
                  apikey={GOOGLE_MAPS_API_KEY}
                  mode="WALKING"
                  strokeWidth={0}
                  strokeColor="transparent"
                  onReady={(result: any) => {
                    const coords = result?.coordinates;
                    if (coords && coords.length >= 2) {
                      setWalkingToBoarding(coords);
                    }
                  }}
                  onError={(err) => {
                    console.warn(
                      '[RouteDetails] Erro MapViewDirections (caminhada até ponto):',
                      err
                    );
                  }}
                />
              )}

              {walkingToBoarding && (
                <>
                  <Polyline
                    coordinates={walkingToBoarding}
                    strokeColor="#999"
                    strokeWidth={3}
                    lineDashPattern={[6, 4]}
                  />
                  {arrowsWalkingToBoarding.map((arrow, index) => (
                    <Marker
                      key={`walkBoard-arrow-${index}`}
                      coordinate={{
                        latitude: arrow.latitude,
                        longitude: arrow.longitude,
                      }}
                      anchor={{ x: 0.5, y: 0.5 }}
                    >
                      <View
                        style={{
                          transform: [
                            { rotate: `${(arrow.angleRad * 180) / Math.PI}deg` },
                          ],
                        }}
                      >
                        <Ionicons
                          name="arrow-forward"
                          size={12}
                          color="#666"
                        />
                      </View>
                    </Marker>
                  ))}
                </>
              )}

              <Marker
                coordinate={{
                  latitude: pontoEmbarque.lat,
                  longitude: pontoEmbarque.lng,
                }}
                anchor={{ x: 0.5, y: 0.5 }}
              >
                <View style={styles.stopMarkerSmall} />
              </Marker>
            </>
          )}

          {/* Ônibus / segmentos */}
          {trajetoriaPorSegmento.map((coords, idx) => {
            const color = idx === 0 ? COLORS.primary : '#8FB8FF';
            const arrows = arrowsBusSegments[idx] || [];
            return coords.length > 1 ? (
              <React.Fragment key={`seg-${idx}`}>
                <Polyline coordinates={coords} strokeColor={color} strokeWidth={5} />
                {arrows.map((arrow, aIdx) => (
                  <Marker
                    key={`seg-${idx}-arrow-${aIdx}`}
                    coordinate={{
                      latitude: arrow.latitude,
                      longitude: arrow.longitude,
                    }}
                    anchor={{ x: 0.5, y: 0.5 }}
                  >
                    <View
                      style={{
                        transform: [
                          { rotate: `${(arrow.angleRad * 180) / Math.PI}deg` },
                        ],
                      }}
                    >
                      <Ionicons
                        name="arrow-forward"
                        size={12}
                        color={idx === 0 ? COLORS.primary : '#8FB8FF'}
                      />
                    </View>
                  </Marker>
                ))}
              </React.Fragment>
            ) : null;
          })}

          {/* Duração ônibus (apenas para refinar tempo total) */}
          {pontoEmbarque && pontoDesembarque && HAS_DIRECTIONS_API && (
            <MapViewDirections
              origin={{
                latitude: pontoEmbarque.lat,
                longitude: pontoEmbarque.lng,
              }}
              destination={{
                latitude: pontoDesembarque.lat,
                longitude: pontoDesembarque.lng,
              }}
              apikey={GOOGLE_MAPS_API_KEY}
              mode="DRIVING"
              strokeWidth={0}
              strokeColor="transparent"
              onReady={(result: any) => {
                if (result?.duration != null) {
                  setBusTravelMinutes(Math.max(1, Math.round(result.duration)));
                }
              }}
              onError={(err) => {
                console.warn(
                  '[RouteDetails] Erro MapViewDirections (trecho ônibus):',
                  err
                );
              }}
            />
          )}

          {/* Caminhada final */}
          {pontoDesembarque && (
            <>
              {HAS_DIRECTIONS_API && (
                <MapViewDirections
                  origin={{
                    latitude: pontoDesembarque.lat,
                    longitude: pontoDesembarque.lng,
                  }}
                  destination={destination}
                  apikey={GOOGLE_MAPS_API_KEY}
                  mode="WALKING"
                  strokeWidth={0}
                  strokeColor="transparent"
                  onReady={(result: any) => {
                    const coords = result?.coordinates;
                    if (coords && coords.length >= 2) {
                      setWalkingToDestination(coords);
                    }
                  }}
                  onError={(err) => {
                    console.warn(
                      '[RouteDetails] Erro MapViewDirections (caminhada final):',
                      err
                    );
                  }}
                />
              )}

              {walkingToDestination && (
                <>
                  <Polyline
                    coordinates={walkingToDestination}
                    strokeColor="#999"
                    strokeWidth={3}
                    lineDashPattern={[10, 5]}
                  />
                  {arrowsWalkingToDestination.map((arrow, index) => (
                    <Marker
                      key={`walkDest-arrow-${index}`}
                      coordinate={{
                        latitude: arrow.latitude,
                        longitude: arrow.longitude,
                      }}
                      anchor={{ x: 0.5, y: 0.5 }}
                    >
                      <View
                        style={{
                          transform: [
                            { rotate: `${(arrow.angleRad * 180) / Math.PI}deg` },
                          ],
                        }}
                      >
                        <Ionicons
                          name="arrow-forward"
                          size={12}
                          color="#666"
                        />
                      </View>
                    </Marker>
                  ))}
                </>
              )}

              <Marker
                coordinate={{
                  latitude: pontoDesembarque.lat,
                  longitude: pontoDesembarque.lng,
                }}
                anchor={{ x: 0.5, y: 0.5 }}
              >
                <View style={styles.stopMarkerSmall} />
              </Marker>
            </>
          )}

          {/* Destino final (pino vermelho) */}
          <Marker
            coordinate={destination}
            anchor={{ x: 0.5, y: 0.5 }}
            zIndex={2}
          >
            <Ionicons name="location-sharp" size={32} color="#D93025" />
          </Marker>

          {/* Ônibus em tempo real */}
          {onibusLocation && (
            <Marker
              coordinate={{
                latitude: onibusLocation.latitude,
                longitude: onibusLocation.longitude,
              }}
              anchor={{ x: 0.5, y: 0.5 }}
              zIndex={10}
            >
              <View style={styles.busMarkerContainer}>
                <Ionicons name="bus" size={20} color="#fff" />
              </View>
            </Marker>
          )}
        </MapView>

        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>

        <FloatingActionButton
          onPress={centerMapOnOrigin}
          iconName="locate"
          style={{ bottom: 24 , right: 16 }}
        />

      </Animated.View>

      {/* SHEET INFERIOR */}
      <Animated.View style={[styles.sheetContainer, sheetStyle]}>
        <PanGestureHandler
          onGestureEvent={gestureHandler}
          onHandlerStateChange={onGestureStateChange}
        >
          <Animated.View>
            <View style={styles.handleContainer}>
              <View style={styles.dragHandle} />
            </View>

            <View style={styles.headerInfo}>
              <View style={styles.headerRow}>
                <View>
                  <Text style={styles.lineLabel}>Linha</Text>
                  <Text style={styles.lineNumberText}>{displayLineLabel}</Text>
                  {linhaNomePrincipal && (
                    <Text style={styles.lineSubtitleText}>
                      {linhaNomePrincipal}
                    </Text>
                  )}
                </View>

                {onibusLocation && (
                  <View style={styles.tagLive}>
                    <Text style={styles.tagLiveText}>Em Circulação</Text>
                  </View>
                )}
              </View>

              <View style={styles.cardsRow}>
                <View style={styles.cardSmall}>
                  <Text style={styles.cardTitle}>Origem</Text>
                  <Text style={styles.cardValue} numberOfLines={1}>
                    Localização atual
                  </Text>
                </View>
                <View style={styles.cardSmall}>
                  <Text style={styles.cardTitle}>Destino</Text>
                  <Text style={styles.cardValue} numberOfLines={1}>
                    {destAddress ?? '—'}
                  </Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Ionicons name="walk-outline" size={18} />
                  <View style={{ marginLeft: 8 }}>
                    <Text style={styles.infoLabel}>Até o ponto</Text>
                    <Text style={styles.infoValue}>
                      {formatMinutes(walkToBoardingMinutes)}
                    </Text>
                  </View>
                </View>

                <View style={styles.infoItem}>
                  <Ionicons name="time-outline" size={18} />
                  <View style={{ marginLeft: 8 }}>
                    <Text style={styles.infoLabel}>Ônibus chegará no ponto</Text>
                    <Text style={styles.infoValue}>
                      {waitAtStopMinutes != null
                        ? new Date(
                            Date.now() + waitAtStopMinutes * 60000
                          ).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false,
                          })
                        : '--:--'}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Ionicons name="hourglass-outline" size={18} />
                  <View style={{ marginLeft: 8 }}>
                    <Text style={styles.infoLabel}>Espera no ponto</Text>
                    <Text style={styles.infoValue}>
                      {formatMinutes(waitAtStopMinutes)}
                    </Text>
                  </View>
                </View>

                <View style={styles.infoItem}>
                  <Ionicons name="contract-outline" size={18} />
                  <View style={{ marginLeft: 8 }}>
                    <Text style={styles.infoLabel}>Tempo de viagem</Text>
                    <Text style={styles.infoValue}>
                      {formatMinutes(travelAfterBoardMinutes)}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={[styles.infoRow, { marginTop: 6 }]}>
                <View style={styles.infoItem}>
                  <Ionicons name="timer-outline" size={18} />
                  <View style={{ marginLeft: 8 }}>
                    <Text style={styles.infoLabel}>Tempo total</Text>
                    <Text style={styles.infoValue}>
                      {formatMinutes(totalTravelMinutes)}
                    </Text>
                  </View>
                </View>
                <View style={{ width: '48%' }} />
              </View>
            </View>
          </Animated.View>
        </PanGestureHandler>

        <View className="content" style={styles.contentContainer}>
          <ScrollView
            style={styles.scrollContent}
            contentContainerStyle={{ paddingBottom: 120 }}
          >
            <View style={styles.timelineTitleRow}>
              <Text style={styles.timelineTitle}>
                {displayLineLabel}
                {linhaNomePrincipal ? ` · ${linhaNomePrincipal}` : ''}: Da
                origem ao destino
              </Text>
            </View>

            {segments.map((segment, sIndex) => (
              <View key={`segment-${segment.linha}`} style={styles.segmentBlock}>
                <View style={styles.segmentHeader}>
                  <Text style={styles.segmentTitle}>
                    Linha {segment.linha}
                  </Text>
                  {segment.linhaNome && (
                    <Text style={styles.segmentSubtitle}>
                      {segment.linhaNome}
                    </Text>
                  )}
                  {segments.length > 1 && (
                    <Text style={styles.segmentSubtitle}>
                      Trecho {sIndex + 1}
                    </Text>
                  )}
                </View>

                {segment.stops.map((p, i) => {
                  const pertenceAoIntervalo = (() => {
                    const linhaEmb = pontoEmbarque?.linha;
                    const linhaDes = pontoDesembarque?.linha;
                    if (linhaEmb === segment.linha && linhaDes === segment.linha) {
                      return (
                        p.sequencia >=
                          (pontoEmbarque?.sequencia ?? -Infinity) &&
                        p.sequencia <=
                          (pontoDesembarque?.sequencia ?? Infinity)
                      );
                    }
                    if (linhaEmb === segment.linha && linhaDes !== segment.linha) {
                      return (
                        p.sequencia >= (pontoEmbarque?.sequencia ?? -Infinity)
                      );
                    }
                    if (linhaDes === segment.linha && linhaEmb !== segment.linha) {
                      return (
                        p.sequencia <= (pontoDesembarque?.sequencia ?? Infinity)
                      );
                    }
                    return true;
                  })();

                  const opacity = pertenceAoIntervalo ? 1 : 0.45;

                  return (
                    <View key={p.id} style={[styles.stopRow, { opacity }]}>
                      <View style={styles.timelineColumn}>
                        <View
                          style={[
                            styles.lineVertical,
                            {
                              backgroundColor: p.passou
                                ? COLORS.primary
                                : '#ddd',
                            },
                          ]}
                        />
                        <View
                          style={[
                            styles.dot,
                            {
                              backgroundColor: p.passou ? '#aaa' : '#fff',
                              borderColor: p.passou ? '#aaa' : COLORS.primary,
                            },
                          ]}
                        />
                        {i < segment.stops.length - 1 && (
                          <View style={styles.lineVertical} />
                        )}
                      </View>
                      <View style={styles.stopDetails}>
                        <Text
                          style={[
                            styles.stopName,
                            { color: p.passou ? '#888' : '#000' },
                          ]}
                        >
                          {p.nome}
                        </Text>
                        {p.id === pontoEmbarque?.id && (
                          <Text style={styles.statusText}>Seu embarque</Text>
                        )}
                        {p.id === pontoDesembarque?.id && (
                          <Text style={styles.statusText}>Seu desembarque</Text>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            ))}
          </ScrollView>
        </View>

        {/* BOTÕES INFERIORES */}
        <View
          style={[
            styles.bottomActions,
            { paddingBottom: (insets.bottom || 0) + 12 },
          ]}
        >
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() =>
              router.push({
                pathname: '/(modal)/tracking',
                params: {
                  lineNumber: linhasNumeros.join(','), // "2" ou "11,2"
                  lineName: linhaNomePrincipal ?? undefined,
                  originLat,
                  originLng,
                  destLat,
                  destLng,
                },
              })
            }
          >
            <Text style={styles.primaryBtnText}>Acompanhar viagem</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  mapContainer: { width: '100%', overflow: 'hidden' },
  backBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 40,
    left: 20,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 25,
    elevation: 5,
  },
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
  stopMarkerSmall: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#666',
  },
  sheetContainer: {
    width: '100%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    elevation: 20,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    flexDirection: 'column',
  },
  handleContainer: { width: '100%', alignItems: 'center', paddingVertical: 12 },
  dragHandle: { width: 40, height: 5, backgroundColor: '#ddd', borderRadius: 3 },
  headerInfo: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  lineLabel: {
    fontSize: 12,
    color: '#888',
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  lineNumberText: { fontSize: 22, fontWeight: 'bold', color: COLORS.primary },
  lineSubtitleText: {
    fontSize: 13,
    color: '#555',
    marginTop: 2,
  },
  tagLive: {
    backgroundColor: '#e6f4ea',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  tagLiveText: { color: '#1e8e3e', fontSize: 12, fontWeight: 'bold' },
  cardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: 12,
  },
  cardSmall: {
    flex: 1,
    backgroundColor: '#f7f8fb',
    marginRight: 10,
    padding: 12,
    borderRadius: 12,
  },
  cardTitle: { fontSize: 11, color: '#666' },
  cardValue: { fontSize: 14, fontWeight: '700', marginTop: 4 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  infoItem: { flexDirection: 'row', alignItems: 'center', width: '48%' },
  infoLabel: { fontSize: 11, color: '#666' },
  infoValue: { fontSize: 13, fontWeight: '700' },
  contentContainer: { flex: 1 },
  scrollContent: { flex: 1, paddingHorizontal: 24, paddingTop: 6 },
  timelineTitleRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 6,
  },
  timelineTitle: { fontWeight: '700', fontSize: 14 },
  segmentBlock: { marginBottom: 18 },
  segmentHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    gap: 4,
  },
  segmentTitle: { fontSize: 16, fontWeight: '700' },
  segmentSubtitle: { fontSize: 12, color: '#666' },
  stopRow: { flexDirection: 'row', minHeight: 50 },
  timelineColumn: { alignItems: 'center', width: 30, marginRight: 10 },
  lineVertical: { flex: 1, width: 2, backgroundColor: '#ddd', minHeight: 20 },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 3,
    zIndex: 2,
    marginTop: -2,
  },
  stopDetails: { flex: 1, paddingBottom: 20, justifyContent: 'center' },
  stopName: { fontSize: 15, fontWeight: '500' },
  statusText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: 'bold',
    marginTop: 2,
  },
  bottomActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  primaryBtn: {
    flex: 1,
    height: 50,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
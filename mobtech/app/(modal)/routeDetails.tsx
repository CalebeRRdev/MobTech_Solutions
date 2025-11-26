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
import Animated, { useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
import {
  GestureHandlerRootView,
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
} from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import api from '../../service/api';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MIN_SHEET_HEIGHT = SCREEN_HEIGHT * 0.35;
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
  stops: ParadaFormatada[];
}

// --- FUNÇÕES AUXILIARES ---
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

export default function RouteDetails() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const mapRef = useRef<MapView | null>(null);

  const {
    lineNumber,
    originLat,
    originLng,
    destLat,
    destLng,
    destAddress,
  } = params as any;

  const origin = { latitude: parseFloat(originLat), longitude: parseFloat(originLng) };
  const destination = { latitude: parseFloat(destLat), longitude: parseFloat(destLng) };

  // garantir string[] e tipagem explícita para evitar implicit any
  const linhasNumeros: string[] = lineNumber
    ? lineNumber.toString().split(',').map((n: string) => n.trim())
    : [];

  // --- ESTADO ---
  const [loading, setLoading] = useState<boolean>(true);
  const [segments, setSegments] = useState<LinhaSegment[]>([]);
  const [onibusLocation, setOnibusLocation] = useState<OnibusData | null>(null);
  const [pontoEmbarque, setPontoEmbarque] = useState<ParadaFormatada | null>(null);
  const [pontoDesembarque, setPontoDesembarque] = useState<ParadaFormatada | null>(null);

  // ANIMAÇÃO SHEET
  const sheetHeight = useSharedValue<number>(SCREEN_HEIGHT * 0.5);
  const contextHeight = useSharedValue<number>(0);

  // --- 1. CARREGAR PARADAS (um fetch por número de linha) ---
  useEffect(() => {
    const fetchParadas = async () => {
      try {
        const fetches = linhasNumeros.map(async (numLinha: string) => {
          const response = await api.get(`/linhas/numero/${numLinha}`);
          const rawParadas: Parada[] = response.data.linha?.paradas || [];
          const formattedParadas: ParadaFormatada[] = rawParadas
            .map((p) => ({
              id: p.id,
              nome: p.nome,
              lat: p.localizacao.coordinates[1],
              lng: p.localizacao.coordinates[0],
              sequencia: p.LinhaParada.sequencia,
              passou: false,
              linha: numLinha,
            }))
            .sort((a, b) => a.sequencia - b.sequencia);
          return { linha: numLinha, stops: formattedParadas };
        });

        const segmentos = await Promise.all(fetches);
        setSegments(segmentos);

        // descobrir embarque/desembarque (entre todas as paradas)
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

          // ajustar câmera para cobrir origem -> embarque -> desembarque -> destino
          setTimeout(() => {
            mapRef.current?.fitToCoordinates(
              [
                origin,
                { latitude: closestOrigin.lat, longitude: closestOrigin.lng },
                { latitude: closestDest.lat, longitude: closestDest.lng },
                destination,
              ],
              {
                edgePadding: { top: 100, right: 50, bottom: SCREEN_HEIGHT * 0.5, left: 50 },
                animated: true,
              }
            );
          }, 1000);
        }
      } catch (error) {
        console.error('Erro paradas:', error);
      } finally {
        setLoading(false);
      }
    };

    if (linhasNumeros.length > 0) fetchParadas();
    else setLoading(false);

    // reexecutar quando lista de linhas mudar
  }, [JSON.stringify(linhasNumeros)]);

  // --- 2. BUSCAR ÔNIBUS e atualizar paradas.passou por segmento ---
  useEffect(() => {
    const updateBusStatus = async () => {
      try {
        const response = await api.get('/localizacaoOnibus');
        const buses: OnibusData[] = Array.isArray(response.data) ? response.data : [response.data];

        // ônibus relevantes para as linhas atuais
        const busesRelevant = buses.filter((b) => linhasNumeros.includes(b.numero_linha));
        // destacar o primeiro (comportamento original)
        const currentBus = busesRelevant.length > 0 ? busesRelevant[0] : null;
        setOnibusLocation(currentBus);

        // atualizar `passou` por segmento
        setSegments((prevSegments) => {
          const updated = prevSegments.map((seg) => ({
            linha: seg.linha,
            stops: seg.stops.map((s) => ({ ...s, passou: false })),
          }));

          busesRelevant.forEach((bus) => {
            const segIndex = updated.findIndex((s) => s.linha === bus.numero_linha);
            if (segIndex === -1) return;

            const seg = updated[segIndex];
            let closestIndex = -1;
            let minDist = Infinity;
            seg.stops.forEach((p, idx) => {
              const dist = getDistanceFromLatLonInKm(bus.latitude, bus.longitude, p.lat, p.lng);
              if (dist < minDist) {
                minDist = dist;
                closestIndex = idx;
              }
            });

            if (closestIndex !== -1) {
              seg.stops = seg.stops.map((s, idx) => ({ ...s, passou: idx < closestIndex }));
              updated[segIndex] = seg;
              // marcar segmentos anteriores como totalmente passados (assumindo ordem de linhasNumeros)
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
    // reexecuta quando estrutura de segmentos mudar (linhas)
  }, [JSON.stringify(segments.map((s) => s.linha))]);

  // GESTOS E ANIMAÇÃO DO SHEET
  const gestureHandler = (event: PanGestureHandlerGestureEvent) => {
    'worklet';
    let newHeight = contextHeight.value - event.nativeEvent.translationY;
    if (newHeight < MIN_SHEET_HEIGHT) newHeight = MIN_SHEET_HEIGHT;
    if (newHeight > MAX_SHEET_HEIGHT) newHeight = MAX_SHEET_HEIGHT;
    sheetHeight.value = newHeight;
  };

  const onGestureStateChange = (event: any) => {
    'worklet';
    if (event.nativeEvent.state === 2) contextHeight.value = sheetHeight.value;
  };

  const mapStyle = useAnimatedStyle(() => ({ height: SCREEN_HEIGHT - sheetHeight.value }));
  const sheetStyle = useAnimatedStyle(() => ({ height: sheetHeight.value }));

  // Trajetoria por segmento (para desenhar polylines)
  const trajetoriaPorSegmento = useMemo(
    () => segments.map((seg) => seg.stops.map((s) => ({ latitude: s.lat, longitude: s.lng }))),
    [segments]
  );

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* --- MAP (superior) - NÃO alterado funcionalmente --- */}
      <Animated.View style={[styles.mapContainer, mapStyle]}>
        <MapView ref={mapRef} style={StyleSheet.absoluteFillObject} provider={PROVIDER_GOOGLE}>
          {/* Rota a pé inicial */}
          {pontoEmbarque && (
            <>
              <Polyline
                coordinates={[origin, { latitude: pontoEmbarque.lat, longitude: pontoEmbarque.lng }]}
                strokeColor="#999"
                strokeWidth={3}
                lineDashPattern={[10, 5]}
              />
              <Marker
                coordinate={{ latitude: pontoEmbarque.lat, longitude: pontoEmbarque.lng }}
                anchor={{ x: 0.5, y: 0.5 }}
              >
                <View style={styles.stopMarkerSmall} />
              </Marker>
            </>
          )}

          {/* Rota por segmento */}
          {trajetoriaPorSegmento.map((coords, idx) => {
            const color = idx === 0 ? COLORS.primary : '#8FB8FF';
            return coords.length > 1 ? (
              <Polyline key={`seg-${idx}`} coordinates={coords} strokeColor={color} strokeWidth={5} />
            ) : null;
          })}

          {/* Rota a pé final */}
          {pontoDesembarque && (
            <>
              <Polyline
                coordinates={[{ latitude: pontoDesembarque.lat, longitude: pontoDesembarque.lng }, destination]}
                strokeColor="#999"
                strokeWidth={3}
                lineDashPattern={[10, 5]}
              />
              <Marker
                coordinate={{ latitude: pontoDesembarque.lat, longitude: pontoDesembarque.lng }}
                anchor={{ x: 0.5, y: 0.5 }}
              >
                <View style={styles.stopMarkerSmall} />
              </Marker>
            </>
          )}

          {/* Marcadores principais */}
          <Marker coordinate={origin} anchor={{ x: 0.5, y: 0.5 }} zIndex={2}>
            <View style={styles.userMarker}>
              <View style={styles.userMarkerCore} />
            </View>
          </Marker>

          <Marker coordinate={destination} anchor={{ x: 0.5, y: 0.5 }} zIndex={2}>
            <Ionicons name="location-sharp" size={32} color="#D93025" />
          </Marker>

          {onibusLocation && (
            <Marker
              coordinate={{ latitude: onibusLocation.latitude, longitude: onibusLocation.longitude }}
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
      </Animated.View>

      {/* --- SHEET (PARTE INFERIOR) --- */}
      <Animated.View style={[styles.sheetContainer, sheetStyle]}>
        {/* Handle e header */}
        <PanGestureHandler onGestureEvent={gestureHandler} onHandlerStateChange={onGestureStateChange}>
          <Animated.View>
            <View style={styles.handleContainer}>
              <View style={styles.dragHandle} />
            </View>

            {/* Cabeçalho similar à imagem: dois cards (Current Location / Destination) e uma linha de info */}
            <View style={styles.headerInfo}>
              <View style={styles.headerRow}>
                <View>
                  <Text style={styles.lineLabel}>Linha</Text>
                  <Text style={styles.lineNumberText}>{linhasNumeros.join(' / ')}</Text>
                </View>

                {onibusLocation && (
                  <View style={styles.tagLive}>
                    <Text style={styles.tagLiveText}>Em Circulação</Text>
                  </View>
                )}
              </View>

              {/* cards */}
              <View style={styles.cardsRow}>
                <View style={styles.cardSmall}>
                  <Text style={styles.cardTitle}>Localização atual</Text>
                  <Text style={styles.cardValue} numberOfLines={1}>{/* usar origem textual se disponível */}Your position</Text>
                </View>
                <View style={styles.cardSmall}>
                  <Text style={styles.cardTitle}>Destino</Text>
                  <Text style={styles.cardValue} numberOfLines={1}>{destAddress ?? '—'}</Text>
                </View>
              </View>

              {/* info row (reach time / travel time / seats) - apenas visual placeholders */}
              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Ionicons name="time-outline" size={18} />
                  <View style={{ marginLeft: 8 }}>
                    <Text style={styles.infoLabel}>Chegará em: </Text>
                    <Text style={styles.infoValue}>5:50 PM</Text>
                  </View>
                </View>

                <View style={styles.infoItem}>
                  <Ionicons name="contract-outline" size={18} />
                  <View style={{ marginLeft: 8 }}>
                    <Text style={styles.infoLabel}>Tempo de viagem</Text>
                    <Text style={styles.infoValue}>50 Minutos</Text>
                  </View>
                </View>
                
              </View>
            </View>
          </Animated.View>
        </PanGestureHandler>

        {/* Conteúdo rolável: timeline(s) */}
        <View style={styles.contentContainer}>
          <ScrollView style={styles.scrollContent} contentContainerStyle={{ paddingBottom: 120 }}>
            {/* Título da seção de timeline igual ao exemplo */}
            <View style={styles.timelineTitleRow}>
              <Text style={styles.timelineTitle}>Bus {linhasNumeros.join(' / ')}: From origin to destination</Text>
            </View>

            {/* Renderiza um bloco por segmento (baldeação) */}
            {segments.map((segment, sIndex) => (
              <View key={`segment-${segment.linha}`} style={styles.segmentBlock}>
                <View style={styles.segmentHeader}>
                  <Text style={styles.segmentTitle}>Linha {segment.linha}</Text>
                  {segments.length > 1 && <Text style={styles.segmentSubtitle}>Trecho {sIndex + 1}</Text>}
                </View>

                {/* timeline: respeita ordem de sequencia */}
                {segment.stops.map((p, i) => {
                  // decidir se essa parada está no intervalo relevante entre embarque/desembarque
                  const pertenceAoIntervalo = (() => {
                    const linhaEmb = pontoEmbarque?.linha;
                    const linhaDes = pontoDesembarque?.linha;
                    if (linhaEmb === segment.linha && linhaDes === segment.linha) {
                      return p.sequencia >= (pontoEmbarque?.sequencia ?? -Infinity) && p.sequencia <= (pontoDesembarque?.sequencia ?? Infinity);
                    }
                    if (linhaEmb === segment.linha && linhaDes !== segment.linha) {
                      return p.sequencia >= (pontoEmbarque?.sequencia ?? -Infinity);
                    }
                    if (linhaDes === segment.linha && linhaEmb !== segment.linha) {
                      return p.sequencia <= (pontoDesembarque?.sequencia ?? Infinity);
                    }
                    return true;
                  })();

                  const opacity = pertenceAoIntervalo ? 1 : 0.45;

                  return (
                    <View key={p.id} style={[styles.stopRow, { opacity }]}>
                      <View style={styles.timelineColumn}>
                        {/* linha vertical */}
                        <View style={[styles.lineVertical, { backgroundColor: p.passou ? COLORS.primary : '#ddd' }]} />
                        {/* ponto */}
                        <View style={[
                          styles.dot,
                          {
                            backgroundColor: p.passou ? '#aaa' : '#fff',
                            borderColor: p.passou ? '#aaa' : COLORS.primary
                          }
                        ]} />
                        {/* extender linha */}
                        {i < segment.stops.length - 1 && <View style={styles.lineVertical} />}
                      </View>

                      <View style={styles.stopDetails}>
                        <Text style={[styles.stopName, { color: p.passou ? '#888' : '#000' }]}>{p.nome}</Text>
                        {p.id === pontoEmbarque?.id && <Text style={styles.statusText}>Seu Embarque</Text>}
                        {p.id === pontoDesembarque?.id && <Text style={styles.statusText}>Seu Desembarque</Text>}
                      </View>
                    </View>
                  );
                })}
              </View>
            ))}

          </ScrollView>
        </View>

        {/* BOTÕES (mantidos idênticos) */}
        <View style={styles.bottomActions}>
          <TouchableOpacity style={styles.secondaryBtn}>
            <Ionicons name="notifications-outline" size={24} color={COLORS.primary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/(modal)/tracking')}>
            <Text style={styles.primaryBtnText}>Acompanhar Viagem</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  mapContainer: { width: '100%', overflow: 'hidden' },
  backBtn: {
    position: 'absolute', top: Platform.OS === 'ios' ? 50 : 40, left: 20,
    backgroundColor: '#fff', padding: 10, borderRadius: 25, elevation: 5,
  },
  userMarker: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(0, 122, 255, 0.3)', justifyContent: 'center', alignItems: 'center' },
  userMarkerCore: { width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.primary, borderWidth: 2, borderColor: '#fff' },
  busMarkerContainer: { backgroundColor: COLORS.primary, width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#fff', elevation: 5 },
  stopMarkerSmall: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#fff', borderWidth: 2, borderColor: '#666' },

  // SHEET
  sheetContainer: {
    width: '100%', backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    elevation: 20, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10,
    flexDirection: 'column'
  },
  handleContainer: { width: '100%', alignItems: 'center', paddingVertical: 12 },
  dragHandle: { width: 40, height: 5, backgroundColor: '#ddd', borderRadius: 3 },

  headerInfo: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  lineLabel: { fontSize: 12, color: '#888', textTransform: 'uppercase', fontWeight: '700' },
  lineNumberText: { fontSize: 22, fontWeight: 'bold', color: COLORS.primary },

  tagLive: { backgroundColor: '#e6f4ea', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  tagLiveText: { color: '#1e8e3e', fontSize: 12, fontWeight: 'bold' },

  // small cards like the image
  cardsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6, marginBottom: 12 },
  cardSmall: { flex: 1, backgroundColor: '#f7f8fb', marginRight: 10, padding: 12, borderRadius: 12 },
  cardTitle: { fontSize: 11, color: '#666' },
  cardValue: { fontSize: 14, fontWeight: '700', marginTop: 4 },

  // info row
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  infoItem: { flexDirection: 'row', alignItems: 'center', width: '32%' },
  infoLabel: { fontSize: 11, color: '#666' },
  infoValue: { fontSize: 13, fontWeight: '700' },

  // CONTENT
  contentContainer: { flex: 1 },
  scrollContent: { flex: 1, paddingHorizontal: 24, paddingTop: 12 },

  timelineTitleRow: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eee', marginBottom: 6 },
  timelineTitle: { fontWeight: '700', fontSize: 14 },

  segmentBlock: { marginBottom: 18 },

  segmentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  segmentTitle: { fontSize: 16, fontWeight: '700' },
  segmentSubtitle: { fontSize: 12, color: '#666' },

  stopRow: { flexDirection: 'row', minHeight: 50 },
  timelineColumn: { alignItems: 'center', width: 30, marginRight: 10 },
  lineVertical: { flex: 1, width: 2, backgroundColor: '#ddd', minHeight: 20 },
  dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 3, zIndex: 2, marginTop: -2 },

  stopDetails: { flex: 1, paddingBottom: 20, justifyContent: 'center' },
  stopName: { fontSize: 15, fontWeight: '500' },
  statusText: { fontSize: 12, color: COLORS.primary, fontWeight: 'bold', marginTop: 2 },

  // BOTTOM ACTIONS (mantidos)
  bottomActions: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  secondaryBtn: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#f0f4f8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  primaryBtn: {
    flex: 1,
    height: 50,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});






// import React, { useRef, useState, useEffect, useMemo } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   ScrollView,
//   TouchableOpacity,
//   Dimensions,
//   Platform,
//   ActivityIndicator,
// } from 'react-native';
// import { useLocalSearchParams, useRouter } from 'expo-router';
// import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
// import Animated, {
//   useSharedValue,
//   useAnimatedStyle,
//   runOnJS,
// } from 'react-native-reanimated';
// import {
//   GestureHandlerRootView,
//   PanGestureHandler,
//   PanGestureHandlerGestureEvent,
// } from 'react-native-gesture-handler';
// import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
// import { COLORS } from '../../constants/colors';
// import api from '../../service/api';

// const { height: SCREEN_HEIGHT } = Dimensions.get('window');
// const MIN_SHEET_HEIGHT = SCREEN_HEIGHT * 0.35;
// const MAX_SHEET_HEIGHT = SCREEN_HEIGHT * 0.85;

// // --- INTERFACES ---
// interface Parada {
//   id: number;
//   nome: string;
//   localizacao: {
//     type: string;
//     coordinates: [number, number]; // [lng, lat]
//   };
//   LinhaParada: {
//     sequencia: number;
//     sentido: string;
//   };
// }

// interface ParadaFormatada {
//   id: number;
//   nome: string;
//   lat: number;
//   lng: number;
//   sequencia: number;
//   passou: boolean;
// }

// interface OnibusData {
//   onibus_id: number;
//   placa: string;
//   linha: string;
//   numero_linha: string;
//   latitude: number;
//   longitude: number;
// }

// // --- FUNÇÕES AUXILIARES ---
// const getDistanceFromLatLonInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
//   const R = 6371; 
//   const dLat = deg2rad(lat2 - lat1);
//   const dLon = deg2rad(lon2 - lon1);
//   const a =
//     Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//     Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat1)) *
//     Math.sin(dLon / 2) * Math.sin(dLon / 2);
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// };

// const deg2rad = (deg: number) => deg * (Math.PI / 180);

// export default function RouteDetails() {
//   const router = useRouter();
//   const params = useLocalSearchParams();
//   const mapRef = useRef<MapView>(null);

//   const {
//     lineNumber,
//     originLat,
//     originLng,
//     destLat,
//     destLng,
//     destAddress,
//   } = params as any;

//   const origin = { latitude: parseFloat(originLat), longitude: parseFloat(originLng) };
//   const destination = { latitude: parseFloat(destLat), longitude: parseFloat(destLng) };
//   const linhasNumeros = lineNumber ? lineNumber.toString().split(',').map((n: string) => n.trim()) : [];

//   // --- ESTADO ---
//   const [loading, setLoading] = useState(true);
//   const [paradas, setParadas] = useState<ParadaFormatada[]>([]);
//   const [onibusLocation, setOnibusLocation] = useState<OnibusData | null>(null);
//   const [pontoEmbarque, setPontoEmbarque] = useState<ParadaFormatada | null>(null);
//   const [pontoDesembarque, setPontoDesembarque] = useState<ParadaFormatada | null>(null);

//   // --- ANIMAÇÃO ---
//   const sheetHeight = useSharedValue(SCREEN_HEIGHT * 0.5);
//   const contextHeight = useSharedValue(0);

//   // --- 1. CARREGAR PARADAS ---
//   useEffect(() => {
//     const fetchParadas = async () => {
//       try {
//         const numLinhaPrincipal = linhasNumeros[0]; 
//         const response = await api.get(`/linhas/numero/${numLinhaPrincipal}`);
//         const rawParadas: Parada[] = response.data.linha?.paradas || [];

//         const formattedParadas: ParadaFormatada[] = rawParadas
//           .map((p) => ({
//             id: p.id,
//             nome: p.nome,
//             lat: p.localizacao.coordinates[1],
//             lng: p.localizacao.coordinates[0],
//             sequencia: p.LinhaParada.sequencia,
//             passou: false,
//           }))
//           .sort((a, b) => a.sequencia - b.sequencia);

//         setParadas(formattedParadas);

//         if (formattedParadas.length > 0) {
//           let closestOrigin = formattedParadas[0];
//           let minOriginDist = Infinity;
//           let closestDest = formattedParadas[formattedParadas.length - 1];
//           let minDestDist = Infinity;

//           formattedParadas.forEach(p => {
//             const distToOrigin = getDistanceFromLatLonInKm(origin.latitude, origin.longitude, p.lat, p.lng);
//             const distToDest = getDistanceFromLatLonInKm(destination.latitude, destination.longitude, p.lat, p.lng);

//             if (distToOrigin < minOriginDist) { minOriginDist = distToOrigin; closestOrigin = p; }
//             if (distToDest < minDestDist) { minDestDist = distToDest; closestDest = p; }
//           });

//           setPontoEmbarque(closestOrigin);
//           setPontoDesembarque(closestDest);
          
//           setTimeout(() => {
//             mapRef.current?.fitToCoordinates([
//                 origin,
//                 { latitude: closestOrigin.lat, longitude: closestOrigin.lng },
//                 { latitude: closestDest.lat, longitude: closestDest.lng },
//                 destination
//             ], {
//                 edgePadding: { top: 100, right: 50, bottom: SCREEN_HEIGHT * 0.5, left: 50 },
//                 animated: true
//             });
//           }, 1000);
//         }
//       } catch (error) {
//         console.error("Erro paradas:", error);
//       } finally {
//         setLoading(false);
//       }
//     };
//     if (linhasNumeros.length > 0) fetchParadas();
//   }, [lineNumber]);

//   // --- 2. BUSCAR ÔNIBUS ---
//   useEffect(() => {
//     const updateBusStatus = async () => {
//       try {
//         const response = await api.get('/localizacaoOnibus');
//         const buses: OnibusData[] = Array.isArray(response.data) ? response.data : [response.data];
//         const currentBus = buses.find(b => linhasNumeros.includes(b.numero_linha));

//         if (currentBus && paradas.length > 0) {
//             setOnibusLocation(currentBus);
//             let closestStopIndex = -1;
//             let minDist = Infinity;

//             paradas.forEach((p, index) => {
//                 const dist = getDistanceFromLatLonInKm(currentBus.latitude, currentBus.longitude, p.lat, p.lng);
//                 if (dist < minDist) { minDist = dist; closestStopIndex = index; }
//             });

//             if (closestStopIndex !== -1) {
//                 setParadas(prev => prev.map((p, idx) => ({
//                     ...p,
//                     passou: idx < closestStopIndex 
//                 })));
//             }
//         }
//       } catch (error) {}
//     };

//     updateBusStatus();
//     const interval = setInterval(updateBusStatus, 5000);
//     return () => clearInterval(interval);
//   }, [paradas.length]);

//   // --- GESTOS E ANIMAÇÃO ---
//   const gestureHandler = (event: PanGestureHandlerGestureEvent) => {
//     'worklet';
//     let newHeight = contextHeight.value - event.nativeEvent.translationY;
//     if (newHeight < MIN_SHEET_HEIGHT) newHeight = MIN_SHEET_HEIGHT;
//     if (newHeight > MAX_SHEET_HEIGHT) newHeight = MAX_SHEET_HEIGHT;
//     sheetHeight.value = newHeight;
//   };

//   const onGestureStateChange = (event: any) => {
//     'worklet';
//     if (event.nativeEvent.state === 2) contextHeight.value = sheetHeight.value;
//   };

//   const mapStyle = useAnimatedStyle(() => ({ height: SCREEN_HEIGHT - sheetHeight.value }));
//   const sheetStyle = useAnimatedStyle(() => ({ height: sheetHeight.value }));

//   const trajetoriaOnibus = useMemo(() => {
//     if (!pontoEmbarque || !pontoDesembarque) return [];
//     return paradas
//         .filter(p => p.sequencia >= pontoEmbarque.sequencia && p.sequencia <= pontoDesembarque.sequencia)
//         .map(p => ({ latitude: p.lat, longitude: p.lng }));
//   }, [paradas, pontoEmbarque, pontoDesembarque]);

//   if (loading) {
//       return (
//           <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
//               <ActivityIndicator size="large" color={COLORS.primary} />
//           </View>
//       )
//   }

//   return (
//     <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#fff' }}>
      
//       {/* --- SESSÃO MAPA (SUPERIOR) --- */}
//       <Animated.View style={[styles.mapContainer, mapStyle]}>
//         <MapView
//           ref={mapRef}
//           style={StyleSheet.absoluteFillObject}
//           provider={PROVIDER_GOOGLE}
//         >
//             {/* Rota a pé inicial */}
//             {pontoEmbarque && (
//                 <>
//                     <Polyline 
//                         coordinates={[origin, { latitude: pontoEmbarque.lat, longitude: pontoEmbarque.lng }]}
//                         strokeColor="#999" strokeWidth={3} lineDashPattern={[10, 5]}
//                     />
//                     <Marker coordinate={{ latitude: pontoEmbarque.lat, longitude: pontoEmbarque.lng }} anchor={{ x: 0.5, y: 0.5 }}>
//                         <View style={styles.stopMarkerSmall} />
//                     </Marker>
//                 </>
//             )}

//             {/* Rota Ônibus */}
//             {trajetoriaOnibus.length > 1 && (
//                 <Polyline coordinates={trajetoriaOnibus} strokeColor={COLORS.primary} strokeWidth={5} />
//             )}

//             {/* Rota a pé final */}
//             {pontoDesembarque && (
//                 <>
//                     <Polyline 
//                         coordinates={[{ latitude: pontoDesembarque.lat, longitude: pontoDesembarque.lng }, destination]}
//                         strokeColor="#999" strokeWidth={3} lineDashPattern={[10, 5]}
//                     />
//                     <Marker coordinate={{ latitude: pontoDesembarque.lat, longitude: pontoDesembarque.lng }} anchor={{ x: 0.5, y: 0.5 }}>
//                         <View style={styles.stopMarkerSmall} />
//                     </Marker>
//                 </>
//             )}

//             {/* Marcadores Principais */}
//             <Marker coordinate={origin} anchor={{ x: 0.5, y: 0.5 }} zIndex={2}>
//                 <View style={styles.userMarker}><View style={styles.userMarkerCore} /></View>
//             </Marker>
//             <Marker coordinate={destination} anchor={{ x: 0.5, y: 0.5 }} zIndex={2}>
//                 <Ionicons name="location-sharp" size={32} color="#D93025" />
//             </Marker>
//             {onibusLocation && (
//                 <Marker
//                     coordinate={{ latitude: onibusLocation.latitude, longitude: onibusLocation.longitude }}
//                     anchor={{ x: 0.5, y: 0.5 }} zIndex={10}
//                 >
//                     <View style={styles.busMarkerContainer}>
//                         <Ionicons name="bus" size={20} color="#fff" />
//                     </View>
//                 </Marker>
//             )}
//         </MapView>
        
//         <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
//           <Ionicons name="arrow-back" size={24} color="#000" />
//         </TouchableOpacity>
//       </Animated.View>

//       {/* --- SESSÃO INFERIOR (SHEET) --- */}
//       <Animated.View style={[styles.sheetContainer, sheetStyle]}>
        
//         {/* ÁREA DE ARRASTE (Apenas Handle e Header) */}
//         <PanGestureHandler onGestureEvent={gestureHandler} onHandlerStateChange={onGestureStateChange}>
//           <Animated.View>
//             <View style={styles.handleContainer}>
//               <View style={styles.dragHandle} />
//             </View>

//             <View style={styles.headerInfo}>
//               <View style={styles.headerRow}>
//                   <View>
//                       <Text style={styles.lineLabel}>Linha</Text>
//                       <Text style={styles.lineNumberText}>{linhasNumeros.join(' / ')}</Text>
//                   </View>
//                   {onibusLocation && (
//                       <View style={styles.tagLive}>
//                           <Text style={styles.tagLiveText}>Em Circulação</Text>
//                       </View>
//                   )}
//               </View>
//               <Text style={styles.addressText} numberOfLines={1}>Destino: {destAddress}</Text>
//             </View>
//           </Animated.View>
//         </PanGestureHandler>

//         {/* CONTEÚDO ROLÁVEL (Livre do PanGestureHandler) */}
//         <View style={styles.contentContainer}>
//             <ScrollView style={styles.scrollContent} contentContainerStyle={{ paddingBottom: 100 }}>
//               {paradas.map((p, i) => {
//                   const isRelevant = pontoEmbarque && pontoDesembarque && 
//                                     p.sequencia >= pontoEmbarque.sequencia && 
//                                     p.sequencia <= pontoDesembarque.sequencia;
//                   const opacity = isRelevant ? 1 : 0.4;

//                   return (
//                     <View key={p.id} style={[styles.stopRow, { opacity }]}>
//                         <View style={styles.timelineColumn}>
//                             <View style={[styles.lineVertical, { backgroundColor: p.passou ? COLORS.primary : '#ddd' }]} />
//                             <View style={[
//                                 styles.dot, 
//                                 { 
//                                     backgroundColor: p.passou ? '#aaa' : '#fff',
//                                     borderColor: p.passou ? '#aaa' : COLORS.primary 
//                                 }
//                             ]} />
//                             {i < paradas.length - 1 && <View style={styles.lineVertical} />}
//                         </View>
//                         <View style={styles.stopDetails}>
//                             <Text style={[styles.stopName, { color: p.passou ? '#888' : '#000' }]}>{p.nome}</Text>
//                             {p.id === pontoEmbarque?.id && <Text style={styles.statusText}>Seu Embarque</Text>}
//                             {p.id === pontoDesembarque?.id && <Text style={styles.statusText}>Seu Desembarque</Text>}
//                         </View>
//                     </View>
//                   );
//               })}
//             </ScrollView>
//         </View>

//         {/* BOTÕES DE AÇÃO (Fixos no fundo do Sheet) */}
//         <View style={styles.bottomActions}>
//              <TouchableOpacity style={styles.secondaryBtn}>
//                 <Ionicons name="notifications-outline" size={24} color={COLORS.primary} />
//              </TouchableOpacity>
             
//              <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/(modal)/tracking')}>
//                 <Text style={styles.primaryBtnText}>Acompanhar Viagem</Text>
//              </TouchableOpacity>
//         </View>

//       </Animated.View>

//     </GestureHandlerRootView>
//   );
// }

// const styles = StyleSheet.create({
//   mapContainer: { width: '100%', overflow: 'hidden' },
//   backBtn: {
//     position: 'absolute', top: Platform.OS === 'ios' ? 50 : 40, left: 20,
//     backgroundColor: '#fff', padding: 10, borderRadius: 25, elevation: 5,
//   },
//   userMarker: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(0, 122, 255, 0.3)', justifyContent: 'center', alignItems: 'center' },
//   userMarkerCore: { width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.primary, borderWidth: 2, borderColor: '#fff' },
//   busMarkerContainer: { backgroundColor: COLORS.primary, width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#fff', elevation: 5 },
//   stopMarkerSmall: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#fff', borderWidth: 2, borderColor: '#666' },

//   // SHEET
//   sheetContainer: {
//     width: '100%', backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
//     elevation: 20, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10,
//     flexDirection: 'column' // Garante layout vertical
//   },
//   handleContainer: { width: '100%', alignItems: 'center', paddingVertical: 12 },
//   dragHandle: { width: 40, height: 5, backgroundColor: '#ddd', borderRadius: 3 },
  
//   headerInfo: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
//   headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
//   lineLabel: { fontSize: 12, color: '#888', textTransform: 'uppercase', fontWeight: '700' },
//   lineNumberText: { fontSize: 22, fontWeight: 'bold', color: COLORS.primary },
//   addressText: { marginTop: 5, color: '#666', fontSize: 14 },
//   tagLive: { backgroundColor: '#e6f4ea', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
//   tagLiveText: { color: '#1e8e3e', fontSize: 12, fontWeight: 'bold' },

//   // CONTEÚDO
//   contentContainer: { flex: 1 }, // Flex 1 para ocupar o espaço restante
//   scrollContent: { flex: 1, paddingHorizontal: 24, paddingTop: 10 },
  
//   stopRow: { flexDirection: 'row', minHeight: 50 },
//   timelineColumn: { alignItems: 'center', width: 30, marginRight: 10 },
//   lineVertical: { flex: 1, width: 2, backgroundColor: '#ddd', minHeight: 20 },
//   dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 3, zIndex: 2, marginTop: -2 },
//   stopDetails: { flex: 1, paddingBottom: 20, justifyContent: 'center' },
//   stopName: { fontSize: 15, fontWeight: '500' },
//   statusText: { fontSize: 12, color: COLORS.primary, fontWeight: 'bold', marginTop: 2 },

//   // BOTÕES
//   bottomActions: {
//     flexDirection: 'row',
//     padding: 20,
//     borderTopWidth: 1,
//     borderTopColor: '#eee',
//     backgroundColor: '#fff',
//   },
//   secondaryBtn: {
//     width: 50,
//     height: 50,
//     borderRadius: 12,
//     backgroundColor: '#f0f4f8',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginRight: 12,
//   },
//   primaryBtn: {
//     flex: 1,
//     height: 50,
//     backgroundColor: COLORS.primary,
//     borderRadius: 12,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   primaryBtnText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
// });




// // app/(tabs)/home/route-details.tsx
// import React, { useEffect, useState, useRef } from 'react';
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   StyleSheet,
//   ScrollView,
//   ActivityIndicator,
//   Alert,
// } from 'react-native';
// import { useLocalSearchParams, useRouter } from 'expo-router';
// import MapView, { Marker, Polyline } from 'react-native-maps';
// import { Ionicons } from '@expo/vector-icons';
// import { COLORS } from '../../constants/colors';
// import api from '../../service/api';
// import { ENDPOINTS } from '../../service/endpoints';

// interface Parada {
//   id: number;
//   nome: string;
//   lat: number;
//   lng: number;
//   sequencia: number;
//   isTransfer?: boolean;
// }

// interface RotaDetalhe {
//   linhaNumero: string;
//   linhaNome: string;
//   paradas: Parada[];
//   onibusLocation?: { lat: number; lng: number };
// }

// export default function RouteDetails() {
//   const router = useRouter();
//   const params = useLocalSearchParams();
//   const mapRef = useRef<MapView>(null);

//   const {
//     lineNumber,        // ex: "11,2" ou "11"
//     lineName,
//     originLat,
//     originLng,
//     destLat,
//     destLng,
//     destAddress,
//   } = params as any;

//   const [rotas, setRotas] = useState<RotaDetalhe[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [currentTime, setCurrentTime] = useState(new Date());

//   // Atualiza relógio a cada minuto
//   useEffect(() => {
//     const timer = setInterval(() => setCurrentTime(new Date()), 60000);
//     return () => clearInterval(timer);
//   }, []);

//   // Busca detalhes das linhas
//   useEffect(() => {
//     const fetchRouteDetails = async () => {
//       try {
//         const linhas = lineNumber.split(',').map((n: string) => n.trim());
//         const detalhes: RotaDetalhe[] = [];

//         for (let i = 0; i < linhas.length; i++) {
//           const num = linhas[i];
//           const res = await api.get(`/linhas/numero/${num}`);
//           // const res = await api.get(`/linhas/${num}/paradas`);
//           const data = res.data.linha;

//           const paradasFormatadas: Parada[] = data.paradas.map((p: any) => ({
//             id: p.id,
//             nome: p.nome,
//             lat: p.localizacao.coordinates[1],
//             lng: p.localizacao.coordinates[0],
//             sequencia: p.LinhaParada.sequencia,
//             isTransfer: i < linhas.length - 1 && p.LinhaParada.sequencia === 1,
//           }));

//           detalhes.push({
//             linhaNumero: `Bus ${num}`,
//             linhaNome: data.nome,
//             paradas: paradasFormatadas,
//           });
//         }

//         setRotas(detalhes);
//       } catch (error) {
//         console.error('Erro ao carregar detalhes:', error);
//         Alert.alert('Erro', 'Não foi possível carregar os detalhes da rota.');
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchRouteDetails();
//   }, [lineNumber]);

//   // Atualiza localização do ônibus em tempo real (a cada 10s)
//   useEffect(() => {
//     if (!rotas.length) return;

//     const interval = setInterval(async () => {
//       try {
//         const res = await api.get(ENDPOINTS.LOCALIZACAO_ONIBUS);
//         const buses = Array.isArray(res.data) ? res.data : [res.data];

//         setRotas(prev =>
//           prev.map(rota => {
//             const bus = buses.find((b: any) =>
//               b.linhaId?.toString() === rota.linhaNumero.replace('Bus ', '')
//             );
//             if (bus) {
//               return { ...rota, onibusLocation: { lat: bus.latitude, lng: bus.longitude } };
//             }
//             return rota;
//           })
//         );
//       } catch (error) {
//         console.warn('Erro ao atualizar ônibus:', error);
//       }
//     }, 10000);

//     return () => clearInterval(interval);
//   }, [rotas.length]);

//   // Calcula horário estimado de chegada na primeira parada
//   const estimatedArrival = () => {
//     const eta = rotas[0]?.paradas[0]?.sequencia === 1 ? 12 : 3; // Simulação baseada no /rotas
//     const arrival = new Date(currentTime.getTime() + eta * 60000);
//     return arrival.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
//   };

//   const handleSeeOnMap = () => {
//     router.push({
//       pathname: '/(modal)/tracking',
//       params: {
//         lineNumber,
//         originLat,
//         originLng,
//         destLat,
//         destLng,
//       },
//     });
//   };

//   const handleTakeRide = () => {
//     // Futuro: abrir QR Code, notificação, etc.
//     Alert.alert(
//       'Rota Selecionada',
//       `Você está acompanhando a linha ${lineNumber}\nVamos te avisar quando estiver perto!`,
//       [{ text: 'OK', onPress: handleSeeOnMap }]
//     );
//   };

//   if (loading) {
//     return (
//       <View style={styles.loading}>
//         <ActivityIndicator size="large" color={COLORS.primary} />
//         <Text style={styles.loadingText}>Carregando detalhes da rota...</Text>
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       {/* Mapa pequeno no topo */}
//       <MapView
//         ref={mapRef}
//         style={styles.map}
//         initialRegion={{
//           latitude: parseFloat(originLat),
//           longitude: parseFloat(originLng),
//           latitudeDelta: 0.05,
//           longitudeDelta: 0.05,
//         }}
//       >
//         {/* Origem */}
//         <Marker coordinate={{ latitude: parseFloat(originLat), longitude: parseFloat(originLng) }} pinColor={COLORS.primary} />

//         {/* Destino */}
//         <Marker coordinate={{ latitude: parseFloat(destLat), longitude: parseFloat(destLng) }} pinColor="red" />

//         {/* Ônibus em movimento */}
//         {rotas.map((rota, i) =>
//           rota.onibusLocation ? (
//             <Marker
//               key={i}
//               coordinate={{ latitude: rota.onibusLocation.lat, longitude: rota.onibusLocation.lng }}
//               title={rota.linhaNumero}
//             >
//               <View style={styles.busMarker}>
//                 <Ionicons name="bus" size={28} color={COLORS.primary} />
//               </View>
//             </Marker>
//           ) : null
//         )}

//         {/* Linha da rota */}
//         {rotas[0]?.paradas && (
//           <Polyline
//             coordinates={rotas[0].paradas.map(p => ({ latitude: p.lat, longitude: p.lng }))}
//             strokeColor={COLORS.primary}
//             strokeWidth={4}
//           />
//         )}
//       </MapView>

//       <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
//         {/* Header */}
//         <View style={styles.header}>
//           <TouchableOpacity onPress={() => router.back()}>
//             <Ionicons name="arrow-back" size={24} color="#000" />
//           </TouchableOpacity>
//           <Text style={styles.title}>{rotas.length > 1 ? 'Rota com Baldeação' : rotas[0]?.linhaNumero}</Text>
//         </View>

//         {/* Origem / Destino */}
//         <View style={styles.routeSummary}>
//           <View style={styles.summaryItem}>
//             <Text style={styles.label}>Current Location</Text>
//             <Text style={styles.value}>Sua localização</Text>
//           </View>
//           <Ionicons name="bus" size={24} color={COLORS.primary} />
//           <View style={styles.summaryItem}>
//             <Text style={styles.label}>Destination</Text>
//             <Text style={styles.value} numberOfLines={1}>{destAddress}</Text>
//           </View>
//         </View>

//         {/* ETA + Tempo */}
//         <View style={styles.infoRow}>
//           <View>
//             <Text style={styles.infoLabel}>Reach station at</Text>
//             <Text style={styles.infoValue}>{estimatedArrival()}</Text>
//           </View>
//           <View>
//             <Text style={styles.infoLabel}>Travel time</Text>
//             <Text style={styles.infoValue}>~50 Minutes</Text>
//           </View>
//         </View>

//         {/* Lista de paradas */}
//         {rotas.map((rota, index) => (
//           <View key={index} style={styles.routeSection}>
//             <Text style={styles.routeTitle}>
//               {rota.linhaNumero}: {rota.linhaNome}
//             </Text>
//             {rota.paradas.map((parada, i) => (
//               <View key={parada.id} style={styles.stopRow}>
//                 <View style={styles.stopDot}>
//                   {parada.isTransfer && <View style={styles.transferDot} />}
//                 </View>
//                 <View style={styles.stopLine} />
//                 <View style={{ flex: 1 }}>
//                   <Text style={styles.stopName}>{parada.nome}</Text>
//                   {i === 0 && <Text style={styles.nextStop}>Next Stop • 6:15</Text>}
//                 </View>
//               </View>
//             ))}
//           </View>
//         ))}

//         <TouchableOpacity style={styles.seeOnMapBtn} onPress={handleSeeOnMap}>
//           <Text style={styles.seeOnMapText}>See on map</Text>
//         </TouchableOpacity>

//         <TouchableOpacity style={styles.takeRideBtn} onPress={handleTakeRide}>
//           <Text style={styles.takeRideText}>Take ride</Text>
//         </TouchableOpacity>
//       </ScrollView>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: '#fff' },
//   map: { height: 200 },
//   busMarker: { backgroundColor: '#fff', padding: 4, borderRadius: 20, borderWidth: 2, borderColor: COLORS.primary },
//   content: { flex: 1 },
//   header: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderColor: '#eee' },
//   title: { fontSize: 18, fontWeight: '600', marginLeft: 16 },
//   routeSummary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, backgroundColor: '#f8f9fa' },
//   summaryItem: { flex: 1 },
//   label: { fontSize: 12, color: '#666' },
//   value: { fontSize: 16, fontWeight: '600', marginTop: 4 },
//   infoRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 16, backgroundColor: '#fff' },
//   infoLabel: { fontSize: 12, color: '#666' },
//   infoValue: { fontSize: 18, fontWeight: '600', marginTop: 4 },
//   routeSection: { paddingHorizontal: 20, marginTop: 20 },
//   routeTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12, color: COLORS.primary },
//   stopRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 8 },
//   stopDot: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#ddd', justifyContent: 'center', alignItems: 'center', zIndex: 1 },
//   transferDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary },
//   stopLine: { position: 'absolute', left: 8, top: 20, bottom: -20, width: 2, backgroundColor: '#ddd' },
//   stopName: { fontSize: 16, marginLeft: 16 },
//   nextStop: { fontSize: 14, color: COLORS.primary, marginLeft: 16, marginTop: 4 },
//   seeOnMapBtn: { padding: 16, alignItems: 'center', borderTopWidth: 1, borderColor: '#eee', marginTop: 20 },
//   seeOnMapText: { fontSize: 16, color: COLORS.primary },
//   takeRideBtn: { backgroundColor: COLORS.primary, margin: 20, padding: 18, borderRadius: 12, alignItems: 'center' },
//   takeRideText: { color: '#fff', fontSize: 18, fontWeight: '600' },
//   loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
//   loadingText: { marginTop: 16, color: '#666' },
// });
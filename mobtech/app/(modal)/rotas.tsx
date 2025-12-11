// app/(modal)/rotas.tsx
import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import api from '../../service/api';
import { ENDPOINTS } from '../../service/endpoints';

interface RouteOption {
  tipo: 'direta' | 'baldeacao';
  linhas: string[];
  distancia_ate_parada: number;
  embarque_eta_minutos: number | null;
  hora_prevista_chegada: string | null;
}

interface Route {
  id: string;
  // agora guarda só os números (ex: "2" ou "2,6")
  lineNumber: string;
  // nome/título vindo do banco (ex: "FORMOSA / VIA SHELL" OU "Baldeação: 2 → 6")
  lineName: string;
  distanceKm: number;
  estimatedMinutes: number | null;
  signalStrength: number;
  tipo: 'direta' | 'baldeacao';
}

type RouteParams = {
  originLat?: string;
  originLng?: string;
  destLat?: string;
  destLng?: string;
  destAddress?: string;
};

export default function RecommendedRoutes() {
  const { originLat, originLng, destLat, destLng, destAddress } =
    useLocalSearchParams<RouteParams>();
  const router = useRouter();

  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [linhaNomes, setLinhaNomes] = useState<Record<string, string>>({});

  // para não ficar abrindo o spinner central toda vez
  const firstLoadRef = useRef(true);

  // 1) Buscar nomes das linhas uma vez
  useEffect(() => {
    const fetchLinhaNomes = async () => {
      try {
        const res = await api.get(ENDPOINTS.LINHAS);
        const nomes: Record<string, string> = {};
        res.data.forEach((linha: any) => {
          nomes[linha.numero] = linha.nome;
        });
        setLinhaNomes(nomes);
      } catch (error) {
        console.error('Erro ao buscar linhas:', error);
      }
    };

    fetchLinhaNomes();
  }, []);

  // helper só pra montar o título "Ônibus 2", "Ônibus 2 · Ônibus 6", etc
  const formatLineNumberLabel = (lineNumber: string) => {
    const nums = lineNumber
      .split(',')
      .map((n) => n.trim())
      .filter(Boolean);

    if (!nums.length) return 'Ônibus';

    if (nums.length === 1) {
      return `Linha ${nums[0]}`;
    }

    return nums.map((n) => `Ônibus ${n}`).join(' · ');
  };

  // 2) Função para buscar rotas (reutilizada por auto-refresh e swipe)
  const fetchRecommendedRoutes = useCallback(
    async (options?: { manual?: boolean }) => {
      const manual = options?.manual ?? false;

      if (!originLat || !destLat) {
        console.log('❌ Sem origin/dest, não vou buscar rotas');
        return;
      }

      try {
        if (firstLoadRef.current) {
          setLoading(true);
        }

        if (manual) {
          console.log('🔄 Pull-to-refresh acionado');
          setRefreshing(true);
        } else {
          console.log('⏱ Atualização automática de rotas');
        }

        const origem = {
          latitude: Number(originLat),
          longitude: Number(originLng),
        };

        const destino = {
          latitude: Number(destLat),
          longitude: Number(destLng),
        };

        console.log('📡 Chamando POST /rotas com:', origem, destino);
        const res = await api.post(ENDPOINTS.ROTAS, { origem, destino });

        const opcoes: RouteOption[] = res.data.opcoes || [];
        console.log('📥 Rotas recebidas:', JSON.stringify(opcoes, null, 2));

        const rotasFormatadas: Route[] = opcoes.map((opcao, index) => {
          const todasLinhas = opcao.linhas; // ex: ["2"] ou ["2", "6"]
          const linhaPrincipal = todasLinhas[0];
          const nomeLinhaBanco =
            linhaNomes[linhaPrincipal] || 'Linha desconhecida';

          // para passar entre telas (params): apenas números separados por vírgula
          const lineNumber = todasLinhas.join(',');

          // nome amigável exibido embaixo do "Ônibus X"
          const displayName =
            opcao.tipo === 'baldeacao'
              ? `Baldeação: ${todasLinhas.join(' → ')}`
              : nomeLinhaBanco;

          const eta = opcao.embarque_eta_minutos;

          // Se não tiver ETA, mantemos um sinal mínimo (20) para não parecer "morto"
          const signalStrength =
            eta == null
              ? 20
              : Math.max(
                  20,
                  100 - eta * 2
                );

          return {
            id: `${index}-${todasLinhas.join('-')}`,
            lineNumber,
            lineName: displayName,
            distanceKm: Number((opcao.distancia_ate_parada / 1000).toFixed(1)),
            estimatedMinutes: eta,
            signalStrength,
            tipo: opcao.tipo,
          };
        });

        console.log('🧮 Rotas formatadas:', rotasFormatadas);
        setRoutes(rotasFormatadas);
      } catch (error: any) {
        console.error(
          'Erro ao buscar rotas:',
          error.response?.data || error.message
        );
        Alert.alert(
          'Erro',
          error.response?.data?.erro || 'Não foi possível carregar as rotas.'
        );
      } finally {
        if (firstLoadRef.current) {
          setLoading(false);
          firstLoadRef.current = false;
        }
        setRefreshing(false);
      }
    },
    [originLat, originLng, destLat, destLng, linhaNomes]
  );

  // 3) Chamar na primeira vez + interval de 10s
  useEffect(() => {
    if (!originLat || !destLat) return;

    fetchRecommendedRoutes(); // primeira chamada

    const interval = setInterval(() => {
      fetchRecommendedRoutes();
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchRecommendedRoutes, originLat, destLat]);

  const handleSelectRoute = (route: Route) => {
    const numerosLimpos = route.lineNumber
      .split(',')
      .map((n) => n.replace(/[^\d]/g, '').trim())
      .filter(Boolean);

    router.push({
      pathname: '/(modal)/routeDetails',
      params: {
        lineNumber: numerosLimpos.join(','), // "11" ou "11,2"
        lineName: route.lineName,
        originLat,
        originLng,
        destLat,
        destLng,
        destAddress,
        // Se não tivermos ETA, não mandamos um valor numérico
        routeEtaMinutes:
          route.estimatedMinutes != null
            ? Math.round(route.estimatedMinutes).toString()
            : '',
      },
    });
  };

  const renderSignalBars = (strength: number) => {
    const bars = [];
    const levels = [0, 25, 50, 75, 100];
    for (let i = 0; i < 4; i++) {
      const active = strength >= levels[i + 1];
      bars.push(
        <View
          key={i}
          style={[
            styles.signalBar,
            { height: (i + 1) * 4 },
            active ? styles.signalActive : styles.signalInactive,
          ]}
        />
      );
    }
    return <View style={styles.signalContainer}>{bars}</View>;
  };

  const renderRouteCard = ({ item }: { item: Route }) => {
    let etaLabel = 'Sem previsão';

    if (item.estimatedMinutes != null) {
      if (item.estimatedMinutes <= 0) {
        etaLabel = '<1 min';
      } else {
        etaLabel = `${Math.round(item.estimatedMinutes)} min`;
      }
    }

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => handleSelectRoute(item)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.busIconContainer}>
            <Ionicons name="bus" size={24} color={COLORS.primary} />
            {item.tipo === 'baldeacao' && (
              <View style={styles.transferBadge}>
                <Ionicons name="swap-horizontal" size={14} color="#fff" />
              </View>
            )}
          </View>
          <View style={styles.lineInfo}>
            <Text style={styles.lineNumber}>
              {formatLineNumberLabel(item.lineNumber)}
            </Text>
            <Text style={styles.lineName} numberOfLines={1}>
              {item.lineName}
            </Text>
          </View>
          {renderSignalBars(item.signalStrength)}
        </View>

        <View style={styles.divider} />

        <View style={styles.cardFooter}>
          <View style={styles.distanceContainer}>
            <Ionicons
              name="location-outline"
              size={16}
              color={COLORS.textLight}
            />
            <Text style={styles.distanceText}>
              {item.distanceKm} km de você
            </Text>
          </View>

          <Text style={styles.estimatedTime}>{etaLabel}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Rotas recomendadas</Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Buscando rotas...</Text>
          </View>
        ) : routes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="bus-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>Nenhuma rota encontrada</Text>
          </View>
        ) : (
          <FlatList
            data={routes}
            keyExtractor={(item) => item.id}
            renderItem={renderRouteCard}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => fetchRecommendedRoutes({ manual: true })}
                tintColor={COLORS.primary}
              />
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    paddingTop: 4,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginLeft: 16,
  },
  listContent: { padding: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  busIconContainer: {
    width: 40,
    height: 40,
    backgroundColor: '#e6f5f4',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  lineInfo: { flex: 1 },
  lineNumber: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  lineName: { fontSize: 14, color: '#666', marginTop: 2 },
  signalContainer: { flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  signalBar: { width: 3, borderRadius: 1 },
  signalActive: { backgroundColor: COLORS.primary },
  signalInactive: { backgroundColor: '#ddd' },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 8 },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  distanceContainer: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  distanceText: { marginLeft: 6, fontSize: 14, color: '#666' },
  estimatedTime: { fontSize: 18, fontWeight: '600', color: '#1a1a1a' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#666' },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: { marginTop: 16, fontSize: 16, color: '#999' },
  transferBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: COLORS.primary,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
});
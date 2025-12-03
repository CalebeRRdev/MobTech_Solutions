// app/(tabs)/home/rotas.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../constants/colors';
import api from '../../../service/api';
import { ENDPOINTS } from '../../../service/endpoints';

interface RouteOption {
  tipo: 'direta' | 'baldeacao';
  linhas: string[];
  distancia_ate_parada: number;
  embarque_eta_minutos: number;
  hora_prevista_chegada: string;
}

interface Route {
  id: string;
  lineNumber: string;
  lineName: string;
  distanceKm: number;
  estimatedMinutes: number;
  signalStrength: number;
  tipo: 'direta' | 'baldeacao';
}

export default function RecommendedRoutes() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [linhaNomes, setLinhaNomes] = useState<Record<string, string>>({});

  const { originLat, originLng, destLat, destLng, destAddress } = params as {
    originLat: string;
    originLng: string;
    destLat: string;
    destLng: string;
    destAddress: string;
  };

  // Busca nomes das linhas
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

  // Busca rotas recomendadas
  useEffect(() => {
    const fetchRecommendedRoutes = async () => {
      if (!originLat || !destLat) return;

      try {
        setLoading(true);

        const origem = {
          latitude: Number(originLat),
          longitude: Number(originLng),
        };

        const destino = {
          latitude: Number(destLat),
          longitude: Number(destLng),
        };

        const res = await api.post(ENDPOINTS.ROTAS, { origem, destino });

        const opcoes: RouteOption[] = res.data.opcoes || [];

        const rotasFormatadas: Route[] = opcoes.map((opcao, index) => {
          const todasLinhas = opcao.linhas;
          const linhaPrincipal = todasLinhas[0];
          const nomeLinha = linhaNomes[linhaPrincipal] || 'Linha Desconhecida';

          // Formata: "Bus 11, 2"
          const lineNumberText = todasLinhas
            .map((num) => `Bus ${num}`)
            .join(', ');

          // Se for baldeação, mostra "Várias linhas"
          const displayName =
            opcao.tipo === 'baldeacao' ? '(baldeação)' : nomeLinha;

          return {
            id: `${index}-${todasLinhas.join('-')}`,
            lineNumber: lineNumberText,
            lineName: displayName,
            distanceKm: Number((opcao.distancia_ate_parada / 1000).toFixed(1)),
            estimatedMinutes: opcao.embarque_eta_minutos,
            signalStrength: Math.max(
              20,
              100 - opcao.embarque_eta_minutos * 2
            ),
            tipo: opcao.tipo,
          };
        });

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
        setLoading(false);
      }
    };

    fetchRecommendedRoutes();
  }, [originLat, originLng, destLat, destLng, linhaNomes]);

  const handleSelectRoute = (route: Route) => {
    router.push({
      pathname: '/(tabs)/home/routeDetails',
      params: {
        lineNumber: route.lineNumber.replace('Bus ', ''),
        lineName: route.lineName,
        originLat,
        originLng,
        destLat,
        destLng,
        destAddress,
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

  const renderRouteCard = ({ item }: { item: Route }) => (
    <TouchableOpacity style={styles.card} onPress={() => handleSelectRoute(item)}>
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
          <Text style={styles.lineNumber}>{item.lineNumber}</Text>
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
            {item.distanceKm} Km away from you
          </Text>
        </View>
        <Text style={styles.estimatedTime}>{item.estimatedMinutes}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Rotas Recomendadas</Text>
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
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 12,
    paddingHorizontal: 16,
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

  estimatedTime: { fontSize: 24, fontWeight: '600', color: '#1a1a1a' },

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
// app/(tabs)/home/index.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
  // Adicionado Alert para feedback visual
  Alert,
} from 'react-native';
// Removido Marker, pois usaremos showsUserLocation
import MapView, { Marker } from 'react-native-maps'; 
import FloatingActionButton from '../../../components/map/FloatingActionButton';
import { COLORS } from '../../../constants/colors';
import { useSearch } from '../../../context/SearchContext';
import { useGooglePlaces, PlaceSuggestion } from '../../../hooks/useGooglePlaces';
import { useLocation } from '../../../hooks/useLocation';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

type Mode = 'idle' | 'searching' | 'confirmed';

// Adicionada interface para o Marcador de Destino
interface DestinationLocation {
  latitude: number;
  longitude: number;
  address: string;
}

export default function HomeScreen() {
  const [mode, setMode] = useState<Mode>('idle');
  const { location: userLocation, loading: locationLoading } = useLocation();
  const { search, setSearch } = useSearch();
  // Adicionado state para o marcador, pois useSearch é global e pode ser complexo
  const [destinationMarker, setDestinationMarker] = useState<DestinationLocation | null>(null); 

  // useGooglePlaces agora usa um hook que retorna a função de busca e detalhes
  const { suggestions, loading: placesLoading, search: searchPlaces, getDetails } = useGooglePlaces(userLocation);
  const router = useRouter();
  const mapRef = useRef<MapView>(null);

  // FUNÇÃO PARA CENTRALIZAR O MAPA NO USUÁRIO
  const centerMapOnUser = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    } else {
      Alert.alert("Localização", "Aguardando localização do usuário...");
    }
  };

  // Centraliza no usuário apenas na primeira vez que a localização é obtida
  useEffect(() => {
    if (userLocation && mapRef.current && !search.destination) {
      centerMapOnUser();
    }
  }, [userLocation]);

  // Busca em tempo real
  useEffect(() => {
    if (mode === 'searching' && search.query.length >= 3) {
      searchPlaces(search.query);
    }
  }, [search.query, mode]);

  // Ação ao pressionar Enter (Submeter ou Confirmar)
  const handleConfirm = async () => {
    // Ação principal é selecionar a primeira sugestão, garantindo a regionalidade
    if (suggestions.length > 0) {
      await handleSelectPlace(suggestions[0]);
    } else if (search.query.trim().length > 0) {
      // Fallback: Tentar geocodificar o texto puro. 
      // Esta lógica é complexa e exige a Geocoding API com *location bias* (melhor no hook).
      // Por enquanto, faremos a confirmação com o texto, mas é crucial usar a sugestão.
      Alert.alert("Atenção", "Selecione um endereço da lista para garantir a precisão regional!");
      return; 
    }
    Keyboard.dismiss();
  };

  // Ação ao selecionar um local da lista (fluxo principal)
  const handleSelectPlace = async (place: PlaceSuggestion) => {
    const details = await getDetails(place.place_id);
    if (details && userLocation) {
      const destinationData: DestinationLocation = {
        latitude: details.latitude,
        longitude: details.longitude,
        // Usamos a descrição da sugestão (que é mais completa)
        address: place.description || details.address, 
      };

      // 1. Atualiza o Contexto de Busca
      setSearch({
        query: place.description,
        origin: userLocation,
        destination: destinationData,
      });
      // 2. Atualiza o Marcador
      setDestinationMarker(destinationData);
      // 3. Muda o Modo e Centraliza
      setMode('confirmed');
      mapRef.current?.animateToRegion({
        latitude: destinationData.latitude,
        longitude: destinationData.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
    Keyboard.dismiss();
  };
  
  // Limpa a busca e volta para o modo inicial
  const handleBack = () => {
    setMode('idle');
    setSearch({ query: '' });
    setDestinationMarker(null);
    centerMapOnUser();
  };

  const handleFindBus = () => {
    if (search.origin && search.destination) {
      // Navega para a Tela 4 (Recommended Routes)
      router.push({
        pathname: '/(modal)/rotas',
        params: {
          originLat: search.origin.latitude.toString(),
          originLng: search.origin.longitude.toString(),
          destLat: search.destination.latitude.toString(),
          destLng: search.destination.longitude.toString(),
          destAddress: search.destination.address,
        },
      });
    }
  };

  const currentDestination = search.destination as DestinationLocation | undefined;
  
  return (
    <View style={styles.container}>
      {/* MAPA */}
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        showsUserLocation={true} // Habilita o marcador azul nativo do Google
        followsUserLocation={false} // Desabilitado o Marker customizado do usuário que estava deslizando
        showsMyLocationButton={false}
      >
        {/* MARCADOR DO DESTINO (vermelho) */}
        {destinationMarker && (
          <Marker
            coordinate={destinationMarker}
            title={destinationMarker.address}
            pinColor="red"
          />
        )}
      </MapView>

      {/* ABA SUPERIOR (BUSCA) */}
      <View style={styles.topCard}>
        {mode === 'idle' ? (
          <>
            <Text style={styles.title}>Para onde você gostaria de ir?</Text>
            <TouchableOpacity style={styles.searchBar} onPress={() => setMode('searching')}>
              <Ionicons name="search" size={20} color={COLORS.textLight} />
              <Text style={styles.placeholder}>Para onde...</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={styles.searchInputRow}>
              <TouchableOpacity onPress={handleBack}>
                <Ionicons name="arrow-back" size={24} color={COLORS.text} />
              </TouchableOpacity>
              <TextInput
                style={styles.textInput}
                placeholder="Ex: Av. Mato Grosso"
                value={search.query}
                onChangeText={text => setSearch({ query: text })}
                onSubmitEditing={handleConfirm}
                returnKeyType="search"
                autoFocus={mode === 'searching'}
              />
              {placesLoading && <ActivityIndicator size="small" color={COLORS.primary} />}
            </View>

            {/* SUGESTÕES NA ABA SUPERIOR */}
            {mode === 'searching' && search.query.length >= 3 && (
              <View style={styles.suggestionsBox}>
                {placesLoading && <ActivityIndicator style={{ padding: 12 }} />}
                {!placesLoading && suggestions.length > 0 && (
                  <FlatList
                    data={suggestions}
                    keyExtractor={item => item.place_id}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.suggestionItem}
                        onPress={() => handleSelectPlace(item)}
                      >
                        <Ionicons name="location-outline" size={16} color={COLORS.primary} />
                        <View style={{ flex: 1, marginLeft: 8 }}>
                          <Text style={styles.suggestionMain}>{item.structured_formatting.main_text}</Text>
                          <Text style={styles.suggestionSecondary} numberOfLines={1}>
                            {item.structured_formatting.secondary_text}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    )}
                    keyboardShouldPersistTaps="handled"
                  />
                )}
                {!placesLoading && search.query.length >= 3 && suggestions.length === 0 && (
                  <Text style={styles.noResults}>Nenhum resultado</Text>
                )}
              </View>
            )}
            
            {/* BOTÃO CONFIRMAR: Só aparece se houver texto, mas deve ser usado após selecionar uma sugestão */}
            {mode === 'searching' && search.query.length > 0 && suggestions.length === 0 && (
              <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
                 <Ionicons name="alert-circle-outline" size={20} color="#fff" />
                 <Text style={styles.confirmText}>Confirme pela lista de sugestões!</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>

      {/* ABA INFERIOR (FORMULÁRIO DE ROTA) */}
      {mode === 'confirmed' && currentDestination && (
        <View style={styles.bottomCard}>
          <Text style={styles.title}>Para onde você gostaria de ir?</Text>
          <View style={styles.locationRow}>
            <Ionicons name="pin" size={20} color={COLORS.primary} />
            <Text style={styles.locationLabel}>Sua localização</Text>
          </View>

          <View style={[styles.locationRow, { marginTop: 8 }]}>
            <Ionicons name="flag" size={20} color={COLORS.red} />
            <Text style={styles.locationLabel} numberOfLines={1}>
              {currentDestination.address}
            </Text>
          </View>

          <TouchableOpacity style={styles.findBusButton} onPress={handleFindBus}>
            <Text style={styles.findBusText}>Encontrar ônibus</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* BOTÃO FLUTUANTE (Centralizar Usuário) */}
      <FloatingActionButton 
        onPress={centerMapOnUser} 
        iconName="locate" // Mudado para um ícone de localização
        style={{ bottom: mode === 'confirmed' ? 250 : 30 }} // Posiciona acima da aba inferior
      />
    </View>
  );
}

// Removido styles userMarkerContainer, userMarkerDot, userMarkerPulse pois usaremos o nativo
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  topCard: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f4f8',
    padding: 14,
    borderRadius: 12,
  },
  placeholder: {
    marginLeft: 8,
    color: '#666',
    fontSize: 16,
  },
  searchInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  textInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#1a1a1a',
  },
  suggestionsBox: {
    maxHeight: 200,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#eee',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  suggestionMain: { fontSize: 16, fontWeight: '600', color: '#1a1a1a' },
  suggestionSecondary: { fontSize: 14, color: '#666', marginTop: 2 },
  noResults: { padding: 12, color: '#666', fontStyle: 'italic' },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    padding: 14,
    borderRadius: 12,
    justifyContent: 'center',
    marginTop: 12,
  },
  confirmText: { color: '#fff', fontWeight: '600', marginLeft: 8 },

  bottomCard: {
    position: 'absolute',
    bottom: 0, 
    left: 0, // Mudei para 0 para esticar por toda a largura
    right: 0, // Mudei para 0 para esticar por toda a largura
    backgroundColor: '#fff',
    borderRadius: 0, // Removi o arredondamento inferior
    borderTopLeftRadius: 16, // Mantive o arredondamento superior
    borderTopRightRadius: 16, // Mantive o arredondamento superior
    padding: 16,
    paddingBottom: 40, // Adicionei padding inferior para dar espaço (pode ser ajustado)
    elevation: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  locationLabel: {
    marginLeft: 12,
    fontSize: 16,
    color: '#1a1a1a',
  },
  findBusButton: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  findBusText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
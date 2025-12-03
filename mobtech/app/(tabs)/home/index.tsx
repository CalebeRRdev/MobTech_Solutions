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
  Alert,
} from 'react-native';
import MapView, {
  Marker,
  PROVIDER_GOOGLE,
  Region,
} from 'react-native-maps';
import * as ExpoLocation from 'expo-location';
import FloatingActionButton from '../../../components/map/FloatingActionButton';
import { COLORS } from '../../../constants/colors';
import { useSearch } from '../../../context/SearchContext';
import {
  useGooglePlaces,
  PlaceSuggestion,
} from '../../../hooks/useGooglePlaces';
import { useLocation } from '../../../hooks/useLocation';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

type Mode = 'idle' | 'searching' | 'confirmed';

interface DestinationLocation {
  latitude: number;
  longitude: number;
  address: string;
}

export default function HomeScreen() {
  const [mode, setMode] = useState<Mode>('idle');

  const {
    location: userLocation,
    loading: locationLoading,
    permissionStatus,
    error: locationError,
  } = useLocation();

  const { search, setSearch } = useSearch();
  const [destinationMarker, setDestinationMarker] =
    useState<DestinationLocation | null>(null);

  const {
    suggestions,
    loading: placesLoading,
    search: searchPlaces,
    getDetails,
  } = useGooglePlaces(userLocation || undefined);

  const router = useRouter();
  const mapRef = useRef<MapView | null>(null);

  // Fallback (enquanto não tem localização) – centro de Anápolis
  const fallbackRegion: Region = {
    latitude: -16.3286,
    longitude: -48.9534,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  useEffect(() => {
    console.log('userLocation =>', JSON.stringify(userLocation));
    console.log('permissionStatus =>', permissionStatus);
    if (locationError) {
      console.log('locationError =>', locationError);
    }
  }, [userLocation, permissionStatus, locationError]);

  /**
   * Centraliza o mapa na localização atual do usuário.
   *
   * Prioridade:
   * 1) location do hook (rápido, em memória)
   * 2) lastKnownPosition (rápido, cache do SO)
   * 3) getCurrentPositionAsync (mais lento, só usado se não houver nada)
   */
  const centerMapOnUser = async () => {
    try {
      if (!mapRef.current) return;

      // 1. Garante permissão
      let status = permissionStatus;

      if (!status) {
        const perm = await ExpoLocation.getForegroundPermissionsAsync();
        status = perm.status;
      }

      if (status !== ExpoLocation.PermissionStatus.GRANTED) {
        Alert.alert(
          'Localização desativada',
          'Ative a permissão de localização do aplicativo para usar o mapa em tempo real.'
        );
        return;
      }

      // 2. Tenta usar primeiro a localização do hook (já em memória)
      if (userLocation) {
        const { latitude, longitude } = userLocation;
        console.log('[centerMapOnUser] usando location do hook:', {
          latitude,
          longitude,
        });

        mapRef.current.animateCamera(
          {
            center: { latitude, longitude },
            zoom: 17,
          },
          { duration: 800 }
        );
        return;
      }

      // 3. Se não tiver no hook, tenta a última posição conhecida
      const last = await ExpoLocation.getLastKnownPositionAsync();
      if (last) {
        const { latitude, longitude } = last.coords;
        console.log('[centerMapOnUser] usando lastKnownPosition:', {
          latitude,
          longitude,
        });

        mapRef.current.animateCamera(
          {
            center: { latitude, longitude },
            zoom: 17,
          },
          { duration: 800 }
        );
        return;
      }

      // 4. Como último recurso, pede um fix novo (pode demorar)
      const pos = await ExpoLocation.getCurrentPositionAsync({
        accuracy: ExpoLocation.Accuracy.Balanced,
      });

      const { latitude, longitude } = pos.coords;
      console.log('[centerMapOnUser] usando getCurrentPositionAsync:', {
        latitude,
        longitude,
      });

      mapRef.current.animateCamera(
        {
          center: { latitude, longitude },
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

  // Busca em tempo real
  useEffect(() => {
    if (mode === 'searching' && search.query.length >= 3) {
      searchPlaces(search.query);
    }
  }, [search.query, mode]);

  const handleConfirm = async () => {
    if (suggestions.length > 0) {
      await handleSelectPlace(suggestions[0]);
    } else if (search.query.trim().length > 0) {
      Alert.alert(
        'Atenção',
        'Selecione um endereço da lista para garantir a precisão regional!'
      );
      return;
    }
    Keyboard.dismiss();
  };

  const handleSelectPlace = async (place: PlaceSuggestion) => {
    try {
      console.log('[handleSelectPlace] place selecionado:', place.description);

      const details = await getDetails(place.place_id);

      if (!details) {
        console.log('[handleSelectPlace] details veio vazio/null');
        Alert.alert(
          'Erro',
          'Não foi possível obter os detalhes desse destino. Tente novamente.'
        );
        return;
      }

      const destinationData: DestinationLocation = {
        latitude: details.latitude,
        longitude: details.longitude,
        address: place.description || details.address,
      };

      // Usa a origem atual se existir, senão usa a location do hook, senão undefined
      const newOrigin = search.origin ?? userLocation ?? undefined;

      setSearch({
        ...search,
        query: place.description,
        origin: newOrigin,
        destination: destinationData,
      });

      setDestinationMarker(destinationData);
      setMode('confirmed');

      console.log('[handleSelectPlace] indo para destino:', destinationData);

      if (mapRef.current) {
        mapRef.current.animateCamera(
          {
            center: {
              latitude: destinationData.latitude,
              longitude: destinationData.longitude,
            },
            zoom: 17,
          },
          { duration: 800 }
        );
      }
    } catch (err) {
      console.log('[handleSelectPlace] erro ao selecionar destino:', err);
      Alert.alert(
        'Erro',
        'Não foi possível selecionar esse destino agora. Tente novamente.'
      );
    } finally {
      Keyboard.dismiss();
    }
  };

  const handleBack = () => {
    setMode('idle');
    setSearch({ query: '' });
    setDestinationMarker(null);
    centerMapOnUser();
  };

  const handleFindBus = () => {
    const dest = search.destination;
  
    if (!dest) {
      Alert.alert(
        'Destino obrigatório',
        'Escolha um destino na barra de busca antes de procurar ônibus.'
      );
      return;
    }
  
    // Se não tiver origin no contexto, tenta usar userLocation;
    // se mesmo assim não tiver, cai num fallback fixo (centro de Anápolis).
    const origin =
      search.origin ??
      userLocation ?? {
        latitude: -16.3286,
        longitude: -48.9534,
      };
  
    router.push({
      pathname: '/(tabs)/home/rotas',
      params: {
        originLat: origin.latitude.toString(),
        originLng: origin.longitude.toString(),
        destLat: dest.latitude.toString(),
        destLng: dest.longitude.toString(),
        destAddress: dest.address,
      },
    });
  };

  const currentDestination = search.destination as
    | DestinationLocation
    | undefined;

  return (
    <View style={styles.container}>
      {/* MAPA */}
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        provider={PROVIDER_GOOGLE}
        showsUserLocation={true}
        followsUserLocation={false}
        showsMyLocationButton={false}
        initialRegion={fallbackRegion}
        onMapReady={() => {
          console.log('[onMapReady] mapa pronto, centralizando no usuário');
          centerMapOnUser();
        }}
      >
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
            <TouchableOpacity
              style={styles.searchBar}
              onPress={() => setMode('searching')}
            >
              <Ionicons name="search" size={20} color={COLORS.textLight} />
              <Text style={styles.placeholder}>Para onde...</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View className="searchInputRow" style={styles.searchInputRow}>
              <TouchableOpacity onPress={handleBack}>
                <Ionicons name="arrow-back" size={24} color={COLORS.text} />
              </TouchableOpacity>
              <TextInput
                style={styles.textInput}
                placeholder="Ex: Av. Mato Grosso"
                value={search.query}
                onChangeText={(text) => setSearch({ query: text })}
                onSubmitEditing={handleConfirm}
                returnKeyType="search"
                autoFocus={mode === 'searching'}
              />
              {placesLoading && (
                <ActivityIndicator size="small" color={COLORS.primary} />
              )}
            </View>

            {mode === 'searching' && search.query.length >= 3 && (
              <View style={styles.suggestionsBox}>
                {placesLoading && (
                  <ActivityIndicator style={{ padding: 12 }} />
                )}

                {!placesLoading && suggestions.length > 0 && (
                  <FlatList
                    data={suggestions}
                    keyExtractor={(item) => item.place_id}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.suggestionItem}
                        onPress={() => handleSelectPlace(item)}
                      >
                        <Ionicons
                          name="location-outline"
                          size={16}
                          color={COLORS.primary}
                        />
                        <View style={{ flex: 1, marginLeft: 8 }}>
                          <Text style={styles.suggestionMain}>
                            {item.structured_formatting.main_text}
                          </Text>
                          <Text
                            style={styles.suggestionSecondary}
                            numberOfLines={1}
                          >
                            {item.structured_formatting.secondary_text}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    )}
                    keyboardShouldPersistTaps="handled"
                  />
                )}

                {!placesLoading &&
                  search.query.length >= 3 &&
                  suggestions.length === 0 && (
                    <Text style={styles.noResults}>Nenhum resultado</Text>
                  )}
              </View>
            )}

            {mode === 'searching' &&
              search.query.length > 0 &&
              suggestions.length === 0 && (
                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={handleConfirm}
                >
                  <Ionicons
                    name="alert-circle-outline"
                    size={20}
                    color="#fff"
                  />
                  <Text style={styles.confirmText}>
                    Confirme pela lista de sugestões!
                  </Text>
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

          <TouchableOpacity
            style={styles.findBusButton}
            onPress={handleFindBus}
          >
            <Text style={styles.findBusText}>Encontrar ônibus</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* BOTÃO FLUTUANTE (Centralizar Usuário) */}
      <FloatingActionButton
        onPress={centerMapOnUser}
        iconName="locate"
        style={{ bottom: mode === 'confirmed' ? 250 : 30 }}
      />
    </View>
  );
}

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

  suggestionMain: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },

  suggestionSecondary: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },

  noResults: {
    padding: 12,
    color: '#666',
    fontStyle: 'italic',
  },

  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    padding: 14,
    borderRadius: 12,
    justifyContent: 'center',
    marginTop: 12,
  },

  confirmText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },

  bottomCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 0,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    paddingBottom: 40,
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
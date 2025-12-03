// components/map/MapView.tsx
import React, { forwardRef } from 'react';
import { StyleSheet, View, StyleProp, ViewStyle } from 'react-native';
import RNMapView, { Region, PROVIDER_GOOGLE } from 'react-native-maps';

interface MapViewProps extends React.ComponentProps<typeof RNMapView> {
  /** Região controlada (quando o mapa é "controlado") */
  region?: Region;
  /** Estilo opcional pro container externo */
  containerStyle?: StyleProp<ViewStyle>;
}

/**
 * Wrapper de RNMapView para padronizar:
 * - provider Google em iOS e Android
 * - região inicial default (Anápolis) quando nada é passado
 * - uso de forwardRef pra permitir animateToRegion etc.
 */
const MapView = forwardRef<RNMapView, MapViewProps>(
  ({ children, region, initialRegion, style, containerStyle, ...rest }, ref) => {
    const defaultRegion: Region = {
      // Centro de Anápolis como fallback
      latitude: -16.3286,
      longitude: -48.9534,
      latitudeDelta: 0.08,
      longitudeDelta: 0.08,
    };

    // Se a tela não passar nada, usamos defaultRegion como initialRegion.
    // Se "region" for usado (mapa controlado), não forçamos initialRegion.
    const resolvedInitialRegion =
      initialRegion ?? (region ? undefined : defaultRegion);

    return (
      <View style={[styles.container, containerStyle]}>
        <RNMapView
          ref={ref}
          style={StyleSheet.absoluteFillObject}
          provider={PROVIDER_GOOGLE}
          region={region}
          initialRegion={resolvedInitialRegion}
          {...rest}
        >
          {children}
        </RNMapView>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default MapView;
// components/map/MapView.tsx
import React, { forwardRef } from 'react';
import { StyleSheet, View } from 'react-native';
import RNMapView, { Region } from 'react-native-maps';

interface MapViewProps {
  region?: Region;
  children?: React.ReactNode;
}

const MapView = forwardRef<RNMapView, MapViewProps>(({ region, children }, ref) => {
  const defaultRegion: Region = {
    latitude: -23.5505,
    longitude: -46.6333,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  return (
    <View style={styles.container}>
      <RNMapView
        ref={ref}
        style={StyleSheet.absoluteFillObject}
        region={region || defaultRegion}
        showsUserLocation={false} // ← DESATIVA O ÍCONE PADRÃO
        followsUserLocation={false} // ← DESATIVA SEGUIR AUTOMÁTICO
      >
        {children}
      </RNMapView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1 },
});

export default MapView;




// // components/map/MapView.tsx
// import React from 'react';
// import { StyleSheet, View } from 'react-native';
// import { Region } from 'react-native-maps';
// import RNMapView from 'react-native-maps';

// interface MapViewProps {
//   region?: Region;
//   children?: React.ReactNode;
// }

// export default function MapView({ region, children }: MapViewProps) {
//   const defaultRegion: Region = {
//     latitude: -23.5505,
//     longitude: -46.6333,
//     latitudeDelta: 0.0922,
//     longitudeDelta: 0.0421,
//   };

//   return (
//     <View style={styles.container}>
//       <RNMapView
//         style={StyleSheet.absoluteFillObject}
//         region={region || defaultRegion}
//         showsUserLocation
//         followsUserLocation
//       >
//         {children}
//       </RNMapView>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
// });
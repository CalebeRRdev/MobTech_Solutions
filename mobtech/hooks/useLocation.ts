// hooks/useLocation.ts
import * as Location from 'expo-location';
import { useState, useEffect } from 'react';
import { Platform } from 'react-native';

type SimpleLocation = {
  latitude: number;
  longitude: number;
};

export function useLocation() {
  const [location, setLocation] = useState<SimpleLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissionStatus, setPermissionStatus] =
    useState<Location.PermissionStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (!isMounted) return;

        setPermissionStatus(status);

        if (status !== Location.PermissionStatus.GRANTED) {
          setError('Permissão de localização negada.');
          setLoading(false);
          return;
        }

        const current = await Location.getCurrentPositionAsync({
          accuracy:
            Platform.OS === 'android'
              ? Location.Accuracy.Balanced
              : Location.Accuracy.High,
        });

        if (!isMounted) return;

        setLocation({
          latitude: current.coords.latitude,
          longitude: current.coords.longitude,
        });
        setError(null);
      } catch (err: any) {
        if (!isMounted) return;
        console.log('Erro ao obter localização:', err);
        setError('Não foi possível obter a localização do dispositivo.');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadLocation();

    return () => {
      isMounted = false;
    };
  }, []);

  return { location, loading, permissionStatus, error };
}
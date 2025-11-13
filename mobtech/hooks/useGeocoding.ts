// hooks/useGeocoding.ts
import * as Location from 'expo-location';
import { useState } from 'react';

export function useGeocoding() {
  const [loading, setLoading] = useState(false);

  const geocodeAddress = async (
    address: string,
    userLocation?: { latitude: number; longitude: number } | null
  ): Promise<{ latitude: number; longitude: number } | null> => {
    setLoading(true);
    try {
      // Monta a string com bias (Mapbox-like)
      let fullAddress = address;

      if (userLocation) {
        // Bias: "Rua X, perto de -23.55, -46.63"
        fullAddress = `${address} near:${userLocation.latitude},${userLocation.longitude}`;
      }

      // geocodeAsync NÃO aceita options → use string com "near:"
      const results = await Location.geocodeAsync(fullAddress);

      setLoading(false);

      if (results.length > 0) {
        const { latitude, longitude } = results[0];
        return { latitude, longitude };
      }
      return null;
    } catch (error) {
      console.error('Erro ao geocodificar:', error);
      setLoading(false);
      return null;
    }
  };

  return { geocodeAddress, loading };
}
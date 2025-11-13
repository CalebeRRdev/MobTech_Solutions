// hooks/useGooglePlaces.ts
import { useState } from 'react';
import Constants from 'expo-constants'; // Continua sendo necessário para acessar o app.json

export interface PlaceSuggestion {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

export interface Coordinates { 
    latitude: number; 
    longitude: number; 
}

export interface PlaceDetails extends Coordinates {
    address: string;
}

export function useGooglePlaces(userLocation?: Coordinates | null) {
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  // --- MUDANÇA AQUI ---
  // Acessa a chave diretamente do objeto 'extra' no app.json
  const apiKey = (Constants.expoConfig?.extra as any)?.googlePlacesApiKey; 
  // O uso de 'as any' ajuda a evitar erros de tipagem do TypeScript
  // ao acessar propriedades dinâmicas do 'extra'.
  // --------------------

  const search = async (query: string) => {
    if (query.length < 3 || !apiKey) {
      setSuggestions([]);
      // Loga um aviso se a chave estiver faltando, para debug
      if (!apiKey) console.error("ERRO: googlePlacesApiKey não encontrada no app.json/Constants.extra"); 
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        input: query,
        key: apiKey,
        language: 'pt-BR',
        components: 'country:br',
        types: 'geocode|establishment',
      });

      // Implementação do Location Bias para favorecer resultados próximos
      if (userLocation) {
        // locationbias com raio de 50km (50000 metros)
        params.append('locationbias', `circle:50000@${userLocation.latitude},${userLocation.longitude}`); 
      }

      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.status === 'OK' || data.status === 'ZERO_RESULTS') {
        const validSuggestions = data.predictions 
            ? data.predictions.map((p: any) => ({
                place_id: p.place_id,
                description: p.description,
                structured_formatting: p.structured_formatting,
            })) as PlaceSuggestion[]
            : [];
        setSuggestions(validSuggestions);
      } else {
        console.warn('Google Places Status:', data.status, data.error_message);
        setSuggestions([]);
      }
    } catch (error) {
      console.error('Erro na busca de Places:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const getDetails = async (placeId: string): Promise<PlaceDetails | null> => {
    if (!apiKey) return null;
    try {
      const fields = 'geometry,formatted_address'; 
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${apiKey}&fields=${fields}`
      );
      const data = await res.json();
      
      if (data.status === 'OK') {
        const result = data.result;
        const loc = result.geometry.location;
        
        return {
          latitude: loc.lat,
          longitude: loc.lng,
          address: result.formatted_address, 
        };
      } else {
        console.warn('Google Details Status:', data.status);
      }
    } catch (error) {
      console.error('Erro ao obter Detalhes do Local:', error);
    }
    return null;
  };

  return { suggestions, loading, search, getDetails };
}




// // hooks/useGooglePlaces.ts
// import { useState } from 'react';
// // Importação correta da chave de API
// import Constants from 'expo-constants'; 

// export interface PlaceSuggestion {
//   place_id: string;
//   description: string;
//   structured_formatting: {
//     main_text: string;
//     secondary_text: string;
//   };
// }

// export interface Coordinates { 
//     latitude: number; 
//     longitude: number; 
// }

// export interface PlaceDetails extends Coordinates {
//     address: string;
// }

// export function useGooglePlaces(userLocation?: Coordinates | null) {
//   const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
//   const [loading, setLoading] = useState(false);

//   // Usa a variável de ambiente pública do Expo
//   const apiKey = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY; 

//   const search = async (query: string) => {
//     if (query.length < 3 || !apiKey) {
//       setSuggestions([]);
//       return;
//     }

//     setLoading(true);
//     try {
//       const params = new URLSearchParams({
//         input: query,
//         key: apiKey,
//         language: 'pt-BR',
//         components: 'country:br',
//         // Adicionada a propriedade 'types' para focar em endereços ou estabelecimentos
//         types: 'geocode|establishment', 
//       });

//       // Implementação do Location Bias para favorecer resultados próximos
//       if (userLocation) {
//         // locationbias com raio de 50km (50000 metros)
//         params.append('locationbias', `circle:50000@${userLocation.latitude},${userLocation.longitude}`); 
//       }

//       const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params}`;
//       const res = await fetch(url);
//       const data = await res.json();

//       if (data.status === 'OK' || data.status === 'ZERO_RESULTS') {
//         // Filtrar e mapear a estrutura correta (apenas suggestions válidas)
//         const validSuggestions = data.predictions 
//             ? data.predictions.map((p: any) => ({
//                 place_id: p.place_id,
//                 description: p.description,
//                 structured_formatting: p.structured_formatting,
//             })) as PlaceSuggestion[]
//             : [];
//         setSuggestions(validSuggestions);
//       } else {
//         console.warn('Google Places Status:', data.status, data.error_message);
//         setSuggestions([]);
//       }
//     } catch (error) {
//       console.error('Erro na busca de Places:', error);
//       setSuggestions([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const getDetails = async (placeId: string): Promise<PlaceDetails | null> => {
//     if (!apiKey) return null;
//     try {
//       // Pedindo 'formatted_address' para ter o endereço completo
//       const fields = 'geometry,formatted_address'; 
//       const res = await fetch(
//         `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${apiKey}&fields=${fields}`
//       );
//       const data = await res.json();
      
//       if (data.status === 'OK') {
//         const result = data.result;
//         const loc = result.geometry.location;
        
//         return {
//           latitude: loc.lat,
//           longitude: loc.lng,
//           // Usamos formatted_address para ser mais preciso no endereço final
//           address: result.formatted_address, 
//         };
//       } else {
//         console.warn('Google Details Status:', data.status);
//       }
//     } catch (error) {
//       console.error('Erro ao obter Detalhes do Local:', error);
//     }
//     return null;
//   };

//   return { suggestions, loading, search, getDetails };
// }
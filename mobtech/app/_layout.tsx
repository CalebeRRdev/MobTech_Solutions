// app/_layout.tsx
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SearchProvider } from '../context/SearchContext';

export default function RootLayout() {
  return (
    <GestureHandlerRootView>

      <SearchProvider>
        <Stack>
          {/* A rota "(tabs)" é o seu navegador de abas. 
            O headerShown: false garante que as abas não tenham um header duplicado. 
          */}
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
  
          {/* Exemplo de uma tela fora das abas (Login) 
            - Precisa ser adicionada ao Stack principal.
          */}
          <Stack.Screen name="login" options={{ headerShown: false }} />
  
          {/* Configuração de um Modal global (opcional)
            <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
          */}
          <Stack.Screen name="(modal)" options={{ headerShown: false }} />
  
        </Stack>
      </SearchProvider>
      {/* // O Stack principal permite que telas como Login ou Modals sejam empilhadas acima das abas. */}
    </GestureHandlerRootView>
  );
}




// import { Stack } from 'expo-router';
// import { GestureHandlerRootView } from 'react-native-gesture-handler';

// export default function RootLayout() {
//   return (
//     <GestureHandlerRootView style={{ flex: 1 }}>
//       <Stack>
//         <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
//       </Stack>
//     </GestureHandlerRootView>
//   );
// }

//import { Stack } from 'expo-router';
// export default function RootLayout() {
//   return (
//     <Stack>
//       <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
//     </Stack>
//   );
// } 
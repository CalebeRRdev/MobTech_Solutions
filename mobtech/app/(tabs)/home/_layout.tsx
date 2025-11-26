// app/(tabs)/home/_layout.tsx
import { Stack } from 'expo-router';

export default function HomeLayout() { // <-- Garanta que existe 'export default'
  return (
    <Stack>
      {/* Configure opções de stack para a sua aba home aqui, se precisar */}
      <Stack.Screen name="index" options={{ title: 'Minha Home' }} />
      {/* ... outras Stack.Screen... */}
    </Stack>
  );
}



// // app/(tabs)/home/_layout.tsx
// import { Stack } from 'expo-router';

// export default function HomeStackLayout() {
//   return (
//     <Stack>
//       {/* index.tsx é a primeira tela do Stack */}
//       <Stack.Screen name="index" options={{ title: 'Bem-vindo(a)', headerShown: false, }}/>
//       <Stack.Screen name="rotas" options={{ title: 'Rotas Recomendadas',  headerShown: false }} />
//       <Stack.Screen name="route-details" options={{ title: 'Detalhes da Rota', headerShown: false}} />
//       <Stack.Screen name="tracking" options={{ title: 'Rastreio', headerShown: false}} />
//     </Stack>
//   );
// }
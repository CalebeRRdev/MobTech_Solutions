// app/(modals)/_layout.tsx
import { Stack } from 'expo-router';

export default function ModalsLayout() {
  return (
    // Usa o componente Stack para criar uma pilha de navegação
    <Stack screenOptions={{ headerShown: false }}>
      {/* 
        Define o título da tela 'menu'. 
        As outras telas (routeDetails, tracking) serão automaticamente 
        adicionadas à pilha com base nos seus nomes de arquivo.
      */}
      <Stack.Screen
        name="rotas"
        options={{
          title: 'Rotas Recomendadas',
        //   presentation: 'modal' // Opcional: faz a tela abrir como um modal (de baixo para cima) no iOS
        }}
      />
      <Stack.Screen
        name="routeDetails"
        options={{
          title: 'Detalhes da Rota',
        }}
      />
       <Stack.Screen
        name="tracking"
        options={{
          title: 'Rastreamento',
        }}
      />
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
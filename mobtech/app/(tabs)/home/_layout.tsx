// app/(tabs)/home/_layout.tsx
import { Stack } from 'expo-router';

export default function HomeStackLayout() {
  return (
    <Stack>
      {/* index.tsx é a primeira tela do Stack */}
      <Stack.Screen name="index" options={{ title: 'Bem-vindo(a)', headerShown: false}}/>
      <Stack.Screen name="rotas" options={{ title: 'Rotas Recomendadas',  headerShown: false }} />
      <Stack.Screen name="route-details" options={{ title: 'Detalhes da Rota' }} />

    </Stack>
  );
}
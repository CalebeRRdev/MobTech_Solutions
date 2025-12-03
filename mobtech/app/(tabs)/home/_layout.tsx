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
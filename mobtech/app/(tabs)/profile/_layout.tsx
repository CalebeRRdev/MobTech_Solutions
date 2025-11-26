// app/(tabs)/home/_layout.tsx
import { Stack } from 'expo-router';

export default function ProfileScreen() { // <-- Garanta que existe 'export default'
  return (
    <Stack>
      {/* Configure opções de stack para a sua aba home aqui, se precisar */}
      <Stack.Screen name="index" options={{ title: 'Meu perfil' }} />
      {/* ... outras Stack.Screen... */}
    </Stack>
  );
}

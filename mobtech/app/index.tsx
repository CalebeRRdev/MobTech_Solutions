// app/(tabs)/index.tsx
import { Redirect } from 'expo-router';

export default function TabsEntry() {
  // Redireciona a rota / para a primeira aba /home
  return <Redirect href="/(tabs)/home" />; 
}
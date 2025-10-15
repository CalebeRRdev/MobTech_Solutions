import { Stack } from 'expo-router';
import { Platform } from 'react-native';

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#012d81' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '600' },
        contentStyle: { backgroundColor: '#012d81' },
        headerTitleAlign: 'center',
      }}
    >
      <Stack.Screen
        name="index"
        options={{ title: '' }}
      />
      <Stack.Screen
        name="map"
        options={{
          title: '',
          // no iOS o botão de voltar aparece automaticamente.
          // Se quiser sem texto, deixe uma string vazia:
          ...(Platform.OS === 'ios' ? { headerBackTitle: '' } : {}),
        }}
      />
    </Stack>
  );
}
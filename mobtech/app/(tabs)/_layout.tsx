// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false, // O Stack aninhado lidará com os headers
        tabBarActiveTintColor: '#00A89D',
        tabBarStyle: {
          display: 'none',
         }, 
      }}
    >

      {/* A pasta 'home' contém o Stack Navigator da Home */}
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Ionicons name="home-outline" color={color} size={24} />,
        }}
      />

      {/* A pasta 'profile' contém o Stack Navigator do Perfil */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => <Ionicons name="person-outline" color={color} size={24} />,
        }}
      />
    </Tabs>
  );
}
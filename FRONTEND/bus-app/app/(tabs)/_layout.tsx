import { Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#007BFF',   // cor dos ícones/labels ativos
        tabBarInactiveTintColor: '#999',    // cor dos ícones/labels inativos
        tabBarStyle: {
          backgroundColor: '#fff',
          height: 70,
          marginBottom: 0,
          elevation: 4, // sombra para Android
          position: 'absolute', // deixa a barra fixa e estilizada
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: '#007BFF',
        },
        headerShadowVisible: false,
        headerTintColor: '#fff',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'home-sharp' : 'home-outline'}
              color={color}
              size={26}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="ticket"
        options={{
          title: 'Tickets',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'ticket' : 'ticket-outline'}
              color={color}
              size={26}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              color={color}
              size={26}
            />
          ),
        }}
      />
    </Tabs>
  );
}
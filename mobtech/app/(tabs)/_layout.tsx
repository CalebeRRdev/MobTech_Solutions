// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false, // O Stack aninhado lidará com os headers
        // 🔽 Esconde completamente a barra de abas embaixo
        tabBarStyle: {
          display: 'none',
        },
      }}
    >

      {/* A pasta 'home' continua existindo, mas não aparece na barra inferior */}
      <Tabs.Screen
        name="home"
        options={{
          href: null, // esconde o botão "Home" da tab bar
        }}
      />

      {/* A pasta 'profile' contém o Stack Navigator do Perfil */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => (
            <Ionicons name="person-outline" color={color} size={24} />
          ),
        }}
      />
    </Tabs>
  );
}
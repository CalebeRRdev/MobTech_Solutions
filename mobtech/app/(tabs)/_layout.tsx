// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false, // O Stack aninhado lidará com os headers
        tabBarActiveTintColor: '#00A89D',
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


// import { Tabs } from "expo-router";
// import { Ionicons } from "@expo/vector-icons";

// export default function TabsLayout() {
//   return (
//     <Tabs screenOptions={{ headerShown: false }}>
//       <Tabs.Screen 
//         name="home" 
//         options={{ 
//           title: "Home",
//           tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" color={color} size={size} />
//         }} 
//       />
//       <Tabs.Screen 
//         name="profile" 
//         options={{ 
//           title: "Perfil",
//           tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" color={color} size={size} />
//         }} 
//       />
//     </Tabs>
//   );
// }




// // app/(tabs)/_layout.tsx
// import { Tabs } from 'expo-router';
// import { Ionicons } from '@expo/vector-icons';
// import React from 'react';

// export default function TabLayout() {
//   return (
//     <Tabs
//       screenOptions={{
//         headerShown: false, // O Stack aninhado lidará com os headers
//         tabBarActiveTintColor: '#2d83ecff',
//       }}
//     >
//       {/* Ponto de Entrada: Redireciona a rota / para /home */} 
//       <Tabs.Screen name="index" options={{ href: null }} />

//       {/* A pasta 'home' contém o Stack Navigator da Home */}
//       <Tabs.Screen
//         name="home"
//         options={{
//           title: 'Home',
//           tabBarIcon: ({ color }) => <Ionicons name="home-outline" color={color} size={24} />,
//         }}
//       />

//       {/* A pasta 'records' contém o Stack Navigator dos Registros */}
//       <Tabs.Screen
//         name="records"
//         options={{
//           title: 'Registros',
//           tabBarIcon: ({ color }) => <Ionicons name="document-text-outline" color={color} size={24} />,
//         }}
//       />

//       {/* A pasta 'profile' contém o Stack Navigator do Perfil */}
//       <Tabs.Screen
//         name="profile"
//         options={{
//           title: 'Perfil',
//           tabBarIcon: ({ color }) => <Ionicons name="person-outline" color={color} size={24} />,
//         }}
//       />
//     </Tabs>
//   );
// }

// import { Tabs } from 'expo-router';
// import Ionicons from '@expo/vector-icons/Ionicons';

// export default function TabLayout() {
//     return (
//         <Tabs
//             screenOptions={{
//                 tabBarActiveTintColor: '#2d83ecff',
//                 headerStyle: {
//                     backgroundColor: '#1e5ca7ff',
//                 },
//                 headerShadowVisible: false,
//                 headerTintColor: '#fff',
//                 tabBarStyle: {
//                     backgroundColor: '#fff'
//                 },
//                 // headerShown: false
//             }}
//         >
//             <Tabs.Screen 
//                 name="index" 
//                 options={{ 
//                     title: 'Home', 
//                     tabBarIcon: ({ color, focused}) => (
//                         <Ionicons name={focused ? 'map' : 'map-outline'} color={color} size={24}/>
//                     ),
//                 }} 
//             />
            
//             <Tabs.Screen
//                 name="search" 
//                 options={{ 
//                     title: 'search',
//                     tabBarIcon: ({color, focused}) => (
//                         <Ionicons name={focused ? 'search' : 'search-outline'} color={color} size={24}/>
//                     ),
//                 }} 
//             />
//         </Tabs>
//     );
// }

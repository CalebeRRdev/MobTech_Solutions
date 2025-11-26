// app/_layout.tsx
import { Stack } from 'expo-router';
import { SearchProvider } from '../context/SearchContext';

import * as SplashScreen from "expo-splash-screen";
import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Easing, Platform, StyleSheet, Text, View } from "react-native";

// Mantém a splash nativa visível até a gente mandar esconder
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [appReady, setAppReady] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(1)).current;

  // Tempo mínimo que a splash fica 100% visível (antes de começar a sumir)
  const SPLASH_HOLD_MS = 1500;

  // Duração da transição de saída
  const SPLASH_FADE_MS = 1700;

  // Curva bem "Apple-like" (ease-out suave)
  const IOS_EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);

  useEffect(() => {
    async function prepare() {
      try {
        // Se quiser carregar fonts/assets, faz aqui
        // await Font.loadAsync(...)
      } finally {
        setAppReady(true);
      }
    }
    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appReady) {
      // Esconde a splash nativa do Expo (a nossa overlay já está por cima)
      await SplashScreen.hideAsync();

      // Segura a splash um pouco e depois faz a transição suave
      Animated.parallel([
        Animated.sequence([
          Animated.delay(SPLASH_HOLD_MS),
          Animated.timing(scale, {
            toValue: 1.06, // leve zoom a mais, bem sutil
            duration: SPLASH_FADE_MS,
            easing: IOS_EASE_OUT,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.delay(SPLASH_HOLD_MS),
          Animated.timing(opacity, {
            toValue: 0,
            duration: SPLASH_FADE_MS,
            easing: IOS_EASE_OUT,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => setShowSplash(false));
    }
  }, [appReady, opacity, scale]);

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <SearchProvider>
        <Stack>
          {/* A rota "(tabs)" é o seu navegador de abas. 
            O headerShown: false garante que as abas não tenham um header duplicado. 
          */}
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

          {/* Exemplo de uma tela fora das abas (Login) 
            - Precisa ser adicionada ao Stack principal.
          */}
          <Stack.Screen name="login" options={{ headerShown: false }} />

          {/* Configuração de um Modal global (opcional)
            <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
          */}
        </Stack>
      </SearchProvider>

      {/* Splash overlay animada */}
      {showSplash && (
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            styles.splash,
            { opacity, transform: [{ scale }] },
          ]}
        >
          <Text style={styles.title}>MobTech</Text>
        </Animated.View>
      )}

      {/* O Stack principal permite que telas como Login ou Modals sejam empilhadas acima das abas. */}
    </View>
  );
}

const styles = StyleSheet.create({
  splash: {
    backgroundColor: "#00A89D",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: "#FFF",
    fontSize: 48,
    fontWeight: "700",
    letterSpacing: 0.6,

    // SF Pro no iOS, fallback no Android
    fontFamily: Platform.select({
      ios: "System",       // San Francisco (SF Pro)
      android: "Roboto",   // fallback padrão
    }),
  },
});

// app/_layout.tsx
import { Stack } from 'expo-router';
import { SearchProvider } from '../context/SearchContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, Text, View } from 'react-native';

// Mantém a splash nativa visível até a gente mandar esconder
// MAS agora só em produção, para não travar o dev
try {
  if (process.env.NODE_ENV === 'production') {
    SplashScreen.preventAutoHideAsync();
  }
} catch (e) {
  console.log('preventAutoHideAsync já foi chamado ou falhou:', e);
}

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
  const EASING_OUT = Easing.bezier(0.22, 1, 0.36, 1);

  // 1) Simula carregamento de assets / inicialização do app
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

  // 2) Esconde a splash nativa do Expo assim que a root view tiver layout
  const onLayoutRootView = useCallback(async () => {
    if (!appReady) return;

    try {
      // Em dev isso é basicamente no-op,
      // em produção é quem libera a splash nativa.
      await SplashScreen.hideAsync();
    } catch (e) {
      console.log('Erro ao esconder splash nativa:', e);
    }
  }, [appReady]);

  // 3) Roda a ANIMAÇÃO da splash em cima do app (iOS + Android)
  useEffect(() => {
    if (!appReady) return;

    const animation = Animated.parallel([
      Animated.sequence([
        Animated.delay(SPLASH_HOLD_MS),
        Animated.timing(scale, {
          toValue: 1.06, // leve zoom a mais, bem sutil
          duration: SPLASH_FADE_MS,
          easing: EASING_OUT,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.delay(SPLASH_HOLD_MS),
        Animated.timing(opacity, {
          toValue: 0,
          duration: SPLASH_FADE_MS,
          easing: EASING_OUT,
          useNativeDriver: true,
        }),
      ]),
    ]);

    animation.start(() => {
      setShowSplash(false);
    });
  }, [appReady, opacity, scale]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
        <SearchProvider>
          <Stack>
            {/* A rota "(tabs)" é o seu navegador de abas. 
                O headerShown: false garante que as abas não tenham um header duplicado. */}
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

            {/* Tela fora das abas (Login) */}
            <Stack.Screen name="login" options={{ headerShown: false }} />

            {/* Novo grupo de modais usando a pasta (modal) */}
            <Stack.Screen name="(modal)" options={{ headerShown: false }} />
            {/* Se um dia quiser um modal "solto":
                <Stack.Screen name="modal" options={{ presentation: 'modal' }} /> 
            */}
          </Stack>
        </SearchProvider>

        {/* Splash overlay animada em cima de TUDO */}
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
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  splash: {
    backgroundColor: '#00A89D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#FFF',
    fontSize: 48,
    fontWeight: '700',
    letterSpacing: 0.6,
    // SF Pro no iOS, fallback no Android
    fontFamily: Platform.select({
      ios: 'System', // San Francisco (SF Pro)
      android: 'Roboto',
    }),
  },
});
import { Stack, useRouter, useSegments } from 'expo-router';
import { SessionProvider, useSession } from '../src/lib/SessionProvider';
import { useEffect } from 'react';
import { View, ActivityIndicator, Platform } from 'react-native';

function InitialLayout() {
  const { profile, isLoading } = useSession();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // 웹 환경일 때, 카카오 JavaScript SDK 스크립트 파일을 불러와서,
    // Kakao.init(카카오 JavaScript SDK) 호출하여 SDK 초기화
    if (Platform.OS === 'web') {
      const script = document.createElement('script');
      script.src = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js';
      script.integrity = 'sha384-TiCUE00h649CAMonG018J2ujOgDKW/kVWlChEuu4jK2vxfAAD0eZxzCKakxg55G4';
      script.crossOrigin = 'anonymous';
      script.onload = () => {
        if (window.Kakao && !window.Kakao.isInitialized()) {
          window.Kakao.init(process.env.EXPO_PUBLIC_KAKAO_JAVASCRIPT_KEY); // 실제 JavaScript 키로 교체해주세요.
        }
      };
      document.head.appendChild(script);
    }
  }, []);

  useEffect(() => {
    if (isLoading) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!profile && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (profile && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [profile, isLoading, segments]);

  if (isLoading) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" /></View>;
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="kakao/callback" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SessionProvider>
      <InitialLayout />
    </SessionProvider>
  );
}

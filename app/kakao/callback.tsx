'use client';

import { useEffect } from 'react';
import { SearchParams, useRouter } from 'expo-router';
import { useSession } from '../../src/lib/SessionProvider';
import { View, ActivityIndicator } from 'react-native';
import { useSearchParams } from 'expo-router/build/hooks';

const EXPO_PUBLIC_API_KEY = process.env.EXPO_PUBLIC_API_KEY;

export default function KakaoCallback() {
  const router = useRouter();
  const params = useSearchParams();
  const { signIn } = useSession();

  useEffect(() => {
    // kakao.com/oauth/authorize로 받은 code를 통해
    // 백엔드 서버에 보내서 accessToken 값 받는다. (백엔드가 카카오 서버에 토큰 요청)
    const code = params.get('code');
    if (code) {
      fetch(`${EXPO_PUBLIC_API_KEY}/api/auth/kakao/login`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code, platform: 'web' }),
      })
      .then(res => res.json())
      .then(data => {
        // 성공하면 세션에 로그인 정보 저장
        if (data.accessToken && data.userInfo) {
          signIn({ accessToken: data.accessToken, userInfo: data.userInfo });
        } 
        // 실패하면 로그인 화면으로 이동
        else {
          router.replace('/(auth)/login');
        }
      })
      .catch(error => {
        console.error(error);
        router.replace('/(auth)/login');
      });
    }
  }, [params]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  );
}

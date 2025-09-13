'use client';

import { useEffect } from 'react';
import { SearchParams, useRouter } from 'expo-router';
import { useSession } from '../../src/lib/SessionProvider';
import { View, ActivityIndicator } from 'react-native';
import { useSearchParams } from 'expo-router/build/hooks';

export default function KakaoCallback() {
  const router = useRouter();
  const params = useSearchParams();
  const { signIn } = useSession();

  useEffect(() => {
    const code = params.get('code');
    if (code) {
      const KAKAO_REST_API_KEY = process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY; // 실제 REST API 키로 교체해주세요.
 
      const REDIRECT_URI = 'http://localhost:8081/kakao/callback';

      fetch('https://kauth.kakao.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
        body: `grant_type=authorization_code&client_id=${KAKAO_REST_API_KEY}&redirect_uri=${REDIRECT_URI}&code=${code}`,
      })
      .then(res => res.json())
      .then(data => {
        if (data.access_token) {
          signIn(data.access_token); // 토큰을 전달하여 웹 로그인 실행
        } else {
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

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Platform } from 'react-native';
import { login, logout, getProfile, KakaoProfile } from '@react-native-seoul/kakao-login';

const EXPO_PUBLIC_API_KEY = process.env.EXPO_PUBLIC_API_KEY;

// 백엔드에서 받아오는 유저 정보 타입 정의
interface UserProfile {
  id: string;
  nickname: string;
  email?: string;
  profileImageUrl: string;
}

interface SessionContextType {
  profile: UserProfile | null;
  token: string | null;
  signIn: (authData?: { accessToken: string; userInfo: UserProfile } | null) => Promise<void>;
  signOut: () => void;
  isLoading: boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  const handleSession = (sessionData: { userInfo: UserProfile; accessToken: string } | null) => {
    const userProfile = sessionData?.userInfo || null;
    const sessionToken = sessionData?.accessToken || null;

    setProfile(userProfile);
    setToken(sessionToken);
  };

  const value = {
    signIn: async (authData: { token: string; user: UserProfile } | null = null) => {
      setIsLoading(true);
      try {
        // 웹 로그인
        if (authData) { 
          handleSession(authData);
        } else { // 네이티브 로그인
          const kakaoTokens = await login();
          const response = await fetch(`${EXPO_PUBLIC_API_KEY}/api/auth/kakao/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accessToken: kakaoTokens.accessToken, platform: 'native' }),
          });
          const data = await response.json();

          if (data.accessToken && data.userInfo) {
            handleSession(data);
          } else {
            throw new Error('Backend authentication failed');
          }
        }
      } catch (err) {
        console.error('Sign in failed', err);
        handleSession(null);
      } finally {
        setIsLoading(false);
      }
    },
    signOut: async () => {
      setIsLoading(true);
      try {
        if (Platform.OS !== 'web') {
          await logout();
        }
        handleSession(null);
      } catch (err) {
        console.error('Sign out failed', err);
      } finally {
        setIsLoading(false);
      }
    },
    profile,
    token,
    isLoading,
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

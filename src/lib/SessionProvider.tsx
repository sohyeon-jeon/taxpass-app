import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Platform } from 'react-native';
import { login, logout, getProfile, KakaoProfile } from '@react-native-seoul/kakao-login';

interface SessionContextType {
  profile: KakaoProfile | null;
  signIn: (accessToken?: string) => Promise<void>;
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
  const [profile, setProfile] = useState<KakaoProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true); 

  useEffect(() => {
    // 웹 환경에서만 실행
    if (Platform.OS === 'web') {
      try {
        const storedProfile = localStorage.getItem('userProfile');
        if (storedProfile) {
          setProfile(JSON.parse(storedProfile));
        }
      } catch (e) {
        console.error('Failed to load profile from storage', e);
      }
    }
    setIsLoading(false); // 저장소 확인 후 로딩 종료
  }, []);

  const handleSetProfile = (userProfile: KakaoProfile | null) => {
    setProfile(userProfile);
    if (Platform.OS === 'web') {
      if (userProfile) {
        localStorage.setItem('userProfile', JSON.stringify(userProfile));
      } else {
        localStorage.removeItem('userProfile');
      }
    }
  };

  const value = {
    signIn: async (accessToken?: string) => {
      setIsLoading(true);
      try {
        let userProfile: KakaoProfile;
        if (accessToken) { // 웹 로그인
          const response = await fetch('https://kapi.kakao.com/v2/user/me', {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          const profileData = await response.json();
          userProfile = {
            id: profileData.id.toString(),
            email: profileData.kakao_account?.email,
            nickname: profileData.properties?.nickname,
            profileImageUrl: profileData.properties?.profile_image,
            thumbnailImageUrl: profileData.properties?.thumbnail_image,
          };
        } else { // 네이티브 로그인
          await login();
          userProfile = await getProfile();
        }
        handleSetProfile(userProfile);
      } catch (err) {
        console.error('로그인/프로필 가져오기 실패', err);
        handleSetProfile(null);
      } finally {
        setIsLoading(false);
      }
    },
    signOut: async () => {
      setIsLoading(true);
      try {
        // 네이티브에서는 logout, 웹에서는 그냥 상태만 초기화
        if (Platform.OS !== 'web') {
            await logout();
        }
        handleSetProfile(null);
      } catch (err) {
        console.error('로그아웃 실패', err);
      } finally {
        setIsLoading(false);
      }
    },
    profile,
    isLoading,
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

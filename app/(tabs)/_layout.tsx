import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, useWindowDimensions } from 'react-native';

export default function TabLayout() {
  const { width } = useWindowDimensions();

  // pc 환경에서만 제공
  const showUploadTab = Platform.OS === 'web' && width >= 500;

  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{
          title: 'ox 퀴즈',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="McqSubjects"
        options={{
          title: '기출문제',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="OxQuestionUpload"
        options={{
          title: 'OX 문제 업로드',
          headerShown: false,
          href: showUploadTab ? '/OxQuestionUpload' : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cloud-upload-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: '설정',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

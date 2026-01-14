import { View, Text, StyleSheet, Platform, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';

export default function SettingsScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">설정</ThemedText>
      {/* <ThemedText>여기서 알림, 테마, 계정 등 설정 기능을 추가할 수 있어요.</ThemedText> */}

      {Platform.OS === 'web' && (
        <Link href="/(tabs)/question-upload" asChild style={{ marginTop: 20 }}>
          <Pressable>
            <ThemedView lightColor="#eee" darkColor="#333" style={styles.uploadButton}>
              <ThemedText type="subtitle">문제 업로드</ThemedText>
            </ThemedView>
          </Pressable>
        </Link>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  text: {
    fontSize: 16,
    color: '#333',
  },
  uploadButton: {
    padding: 16,
    borderRadius: 8,
  },
});

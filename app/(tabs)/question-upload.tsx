import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import React, { useState } from 'react';
import { Platform, StyleSheet, Pressable, Text, Alert, ActivityIndicator } from 'react-native';
import { useSession } from '../../src/lib/SessionProvider';

export default function QuestionUploadScreen() {
  const { token } = useSession();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFile(event.target.files[0]);
      setResponseMessage(''); 
    }
  };

  const handleUpload = async () => {
    if (!token) {
      Alert.alert('오류', '로그인이 필요합니다.');
      return;
    }

    if (!selectedFile) {
      Alert.alert('오류', '파일을 먼저 선택해주세요.');
      return;
    }

    setUploading(true);
    setResponseMessage('');
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const headers = new Headers();
      headers.append('Authorization', `Bearer ${token}`);

      const baseUrl = process.env.EXPO_PUBLIC_API_KEY;
      

      // ox 퀴즈 엑셀업로드 요청
      const response = await fetch(`${baseUrl}/api/ox-questions/upload`, {
        method: 'POST',
        headers: headers,
        body: formData,
        credentials: 'same-origin', // 
      });

      const result = await response.json();

      if (response.ok) {
        setResponseMessage(`성공: ${result.message || '파일이 성공적으로 업로드되었습니다.'}`);
        Alert.alert('성공', '파일이 성공적으로 업로드되었습니다.');
      } else {
        throw new Error(result.error || '알 수 없는 오류가 발생했습니다.');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setResponseMessage(`오류: ${errorMessage}`);
      Alert.alert('업로드 실패', errorMessage);
    } finally {
      setUploading(false);
    }
  };

  if (Platform.OS !== 'web') {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>이 기능은 웹에서만 사용할 수 있습니다.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">OX 퀴즈 문제 업로드</ThemedText>
      <ThemedText style={styles.description}>
        문제와 정답이 포함된 파일을 업로드해주세요.
      </ThemedText>

      <input
        type="file"
        onChange={handleFileChange}
        style={{ marginVertical: 20 }}
        accept=".csv,.xlsx,.xls,.tsv"
      />

      {selectedFile && (
        <ThemedText>선택된 파일: {selectedFile.name}</ThemedText>
      )}

      {uploading ? (
        <ActivityIndicator size="large" color="#007BFF" style={{ marginTop: 20 }} />
      ) : (
        <Pressable style={styles.button} onPress={handleUpload} disabled={uploading}>
          <Text style={styles.buttonText}>업로드</Text>
        </Pressable>
      )}

      {responseMessage && (
        <ThemedText style={styles.responseMessage}>{responseMessage}</ThemedText>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  description: {
    marginVertical: 12,
  },
  button: {
    backgroundColor: '#007BFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  responseMessage: {
    marginTop: 20,
    textAlign: 'center',
  },
});

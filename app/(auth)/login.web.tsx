import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';

declare global {
  interface Window {
    Kakao: any;
  }
}

export default function LoginScreen() {
  const handleLogin = () => {
    if (window.Kakao && window.Kakao.isInitialized()) {
      window.Kakao.Auth.authorize({
        redirectUri: 'http://localhost:8081/kakao/callback',
        throughTalk: false, // 웹에서는 항상 웹 로그인 창을 사용
      });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Image source={require('../../assets/images/icon.png')} style={styles.logo} />
        <Text style={styles.title}>TaxPass</Text>
        <Text style={styles.subtitle}>세무사 시험 기출문제 앱</Text>
      </View>
      <TouchableOpacity 
        style={styles.authButton}
        onPress={handleLogin}
      >
        <Text style={styles.authButtonText}>카카오로 시작하기</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 40,
  },
  authButton: {
    backgroundColor: '#FEE500',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  authButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
});

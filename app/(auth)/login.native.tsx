import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { useSession } from '../../src/lib/SessionProvider';

export default function LoginScreen() {
  const { signIn, isLoading } = useSession();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Image source={require('../../assets/images/icon.png')} style={styles.logo} />
        <Text style={styles.subtitle}>세무사 시험 기출문제 앱</Text>
      </View>
      <TouchableOpacity 
        style={[styles.authButton, isLoading && styles.disabledButton]}
        onPress={() => signIn()} 
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.authButtonText}>카카오로 시작하기</Text>
        )}
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
  width: 260,
  height: 260,
  marginBottom: 5,
  resizeMode: 'contain',
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
  disabledButton: {
    backgroundColor: '#F0D94B',
  },
});

import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useSession } from '../../src/lib/SessionProvider';

const EXPO_PUBLIC_API_KEY = process.env.EXPO_PUBLIC_API_KEY;

type Subject = {
  id: number;
  name: string;
};

export default function Index() {
  const { profile, signOut } = useSession();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${EXPO_PUBLIC_API_KEY}/subjects`)
      .then((res) => res.json())
      .then((data) => {
        setSubjects(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("API 요청 실패:", err);
        setSubjects([]);
        setLoading(false);
      });
  }, []);

  const router = useRouter();

  const handlePress = (subject: Subject) => {
    router.push(`/questions/OxQuestion/${subject.id}?subjectName=${encodeURIComponent(subject.name)}`);
  };

  return (
    <View style={styles.container}>
      {profile && (
        <View style={styles.profileSection}>
          <View style={styles.profileInfo}>
            <Image source={{ uri: profile.profileImageUrl }} style={styles.profileImage} />
            <Text style={styles.profileText}>{profile.nickname}님, 환영합니다!</Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={() => signOut()}>
            <Text style={styles.logoutButtonText}>로그아웃</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.title}>과목별 기출문제</Text>
      {loading ? (
        <Text>불러오는 중...</Text>
      ) : (
        <FlatList
          data={subjects}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => handlePress(item)}>
              <Text style={styles.cardText}>{item.name}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  profileSection: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileImage: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    marginRight: 12,
  },
  profileText: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1, // Ensure text doesn't overflow
  },
  logoutButton: {
    backgroundColor: '#e0e0e0',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  logoutButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  list: {
    paddingBottom: 16,
  },
  card: {
    backgroundColor: '#f2f2f2',
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
  },
  cardText: {
    fontSize: 18,
    fontWeight: '600',
  },
});

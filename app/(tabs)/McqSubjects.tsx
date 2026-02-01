import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import Constants from 'expo-constants';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';

const EXPO_PUBLIC_API_KEY = process.env.EXPO_PUBLIC_API_KEY

type Subject = {
  id: number;
  name: string;
};

export default function Index() {
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
    router.push(`/questions/McqQuestion/${subject.id}?subjectName=${encodeURIComponent(subject.name)}`);
  };


  return (
    <View style={styles.container}>
      <Text style={styles.title}>기출문제</Text>
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

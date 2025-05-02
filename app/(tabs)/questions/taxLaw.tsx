import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.API_URL;

type Choice = {
  choice_index: number;
  type: string;
  content: string;
};

type ParsedQuestion = {
  id: number;
  number: string;
  year: number;
  examType: string;
  questionText: string;
  choices: Choice[];
  correctAnswer: string;
  explanation: string;
};

export default function TaxLawScreen() {
  const [questions, setQuestions] = useState<ParsedQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/questions/detail`)
      .then((res) => res.json())
      .then((data) => {
        const parsed: ParsedQuestion[] = data.map((item: any[]) => ({
          id: item[0],
          number: item[2],
          year: item[3],
          examType: item[4],
          questionText: item[5],
          choices: JSON.parse(item[7] ?? "[]"),
          correctAnswer: item[8],
          explanation: item[9],
        }));
        setQuestions(parsed);
        setLoading(false);
      })
      .catch((err) => {
        console.error("❌ 세법 문제 로딩 실패:", err);
        setLoading(false);
      });
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>세법 기출문제</Text>
      {loading ? (
        <Text>불러오는 중...</Text>
      ) : (
        <FlatList
          data={questions}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.questionCard}>
              <Text style={styles.questionText}>
                {item.number}. ({item.year} {item.examType}) {item.questionText}
              </Text>
              {item.choices.map((choice) => (
                <Text key={choice.choice_index} style={styles.choiceText}>
                  {`(${choice.choice_index}) ${choice.content}`}
                </Text>
              ))}
              <Text style={styles.answer}>✅ 정답: {item.correctAnswer}</Text>
              {item.explanation && (
                <Text style={styles.explanation}>📘 해설: {item.explanation}</Text>
              )}
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  questionCard: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    marginBottom: 16,
    borderRadius: 10,
    borderColor: '#ddd',
    borderWidth: 1,
  },
  questionText: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  choiceText: { fontSize: 15, marginBottom: 4 },
  answer: { marginTop: 8, fontWeight: 'bold', color: 'green' },
  explanation: { marginTop: 4, fontStyle: 'italic', color: '#555' },
});

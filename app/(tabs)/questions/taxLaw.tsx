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
      {/* 과목명 네모 박스 */}
      <View style={styles.subjectBox}>
        <Text style={styles.subjectText}>세법학개론</Text>
      </View>

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
  subjectBox: {
    borderWidth: 1,
    borderColor: '#000',
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'center', 
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  subjectText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  questionCard: {
    marginBottom: 32,
  },
  questionText: {
    fontSize: 17,
    fontWeight: 'bold',
    lineHeight: 26,
    marginBottom: 12,
    fontFamily: 'serif', // 앱에서는 적용 안될 수도 있음
  },
  choiceText: {
    fontSize: 16,
    lineHeight: 28,
    marginBottom: 6,
    fontFamily: 'serif',
  },
  answer: {
    fontSize: 15,
    marginTop: 12,
    fontWeight: 'bold',
    color: 'green',
  },
  explanation: {
    fontSize: 14,
    marginTop: 6,
    color: '#333',
    fontStyle: 'italic',
  },
});

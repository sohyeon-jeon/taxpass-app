import { View, Text, StyleSheet, Pressable, Image, Platform, Alert, ScrollView } from 'react-native';
import { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import HybridMathJax from '../../../components/HybridMathJax';

// 타입 선언
type TextChoice = { type: 'text'; content: string; choice_index?: number };
type TableChoice = { type: 'table'; content: Record<string, string | number>; choice_index?: number };
type Choice = TextChoice | TableChoice;

type Question = {
  id: number;
  number: number;
  year: number;
  examType: string;
  questionText: string;
  choices: Choice[];
  correctAnswer: string;
  explanation: string;
};

type RawData = [number, any, number, number, string, string, string, any, string, string];

const circledNumbers = ['①', '②', '③', '④', '⑤'];
const redCircle = require('../../../assets/red_circle.png');
const redX = require('../../../assets/red_x.png');

export default function TaxLawScreen() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedChoices, setSelectedChoices] = useState<Record<number, number>>({});
  const [score, setScore] = useState<number | null>(null);
  const [results, setResults] = useState<Record<number, boolean>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const { subjectId, subjectName } = useLocalSearchParams<{ subjectId?: string; subjectName?: string }>();

  useEffect(() => {
    if (!subjectId) return;
    fetch(`${process.env.EXPO_PUBLIC_API_KEY}/questions/${subjectId}`)
      .then(res => res.json())
      .then((data: RawData[]) => {
        const parsed: Question[] = data.map(item => ({
          id: item[0],
          number: item[2],
          year: item[3],
          examType: item[4],
          questionText: item[5],
          choices: JSON.parse(item[6] ?? '[]'),
          correctAnswer: item[7],
          explanation: item[8],
        }));
        setQuestions(parsed);
      })
      .catch(err => console.error('문제 로딩 실패:', err));
  }, [subjectId]);

  const handleSelect = (id: number, index: number) => {
    if (score !== null) return;
    setSelectedChoices(prev => ({ ...prev, [id]: index }));
  };

  const gradeQuestions = () => {
    const result: Record<number, boolean> = {};
    let correct = 0;
    for (const q of questions) {
      const selected = selectedChoices[q.id];
      const answer = parseInt(q.correctAnswer) - 1;
      const isCorrect = selected === answer;
      result[q.id] = isCorrect;
      if (isCorrect) correct++;
    }
    setResults(result);
    setScore(correct);
  };

  return (
    <View style={styles.container}>
      <View style={styles.subjectBox}>
        <View style={styles.centerTitle}>
          <Text style={styles.subjectText}>{subjectName}</Text>
        </View>
        {score !== null && <Text style={styles.scoreText}>{score} / {questions.length}</Text>}
        <Pressable
          style={[styles.submitButton, score !== null && { backgroundColor: '#ccc' }]}
          onPress={() => {
            if (Platform.OS === 'web') {
              if (window.confirm('제출하시겠습니까?')) gradeQuestions();
            } else {
              Alert.alert('제출', '제출하시겠습니까?', [
                { text: '취소', style: 'cancel' },
                { text: '제출', onPress: gradeQuestions },
              ]);
            }
          }}
          disabled={score !== null}
        >
          <Text style={styles.submitButtonText}>제출</Text>
        </Pressable>
      </View>

      {questions.length > 0 && (
        <View style={styles.navigationContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.navigatorScrollView}>
            {questions.map((_, index) => (
              <Pressable
                key={index}
                style={[
                  styles.navigatorButton,
                  currentQuestionIndex === index && styles.navigatorButtonActive
                ]}
                onPress={() => setCurrentQuestionIndex(index)}
              >
                <Text style={[
                  styles.navigatorText,
                  currentQuestionIndex === index && styles.navigatorTextActive
                ]}>{index + 1}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <View style={styles.navigationActions}>
              <Pressable
                  onPress={() => setCurrentQuestionIndex(i => Math.max(0, i - 1))}
                  disabled={currentQuestionIndex === 0}
                  style={[styles.navActionButton, currentQuestionIndex === 0 && styles.disabledButton]}
              >
                  <Text style={styles.navActionText}>이전</Text>
              </Pressable>
              <Text style={styles.questionCounter}>{currentQuestionIndex + 1} / {questions.length}</Text>
              <Pressable
                  onPress={() => setCurrentQuestionIndex(i => Math.min(questions.length - 1, i + 1))}
                  disabled={currentQuestionIndex >= questions.length - 1}
                  style={[styles.navActionButton, currentQuestionIndex >= questions.length - 1 && styles.disabledButton]}
              >
                  <Text style={styles.navActionText}>다음</Text>
              </Pressable>
          </View>
        </View>
      )}

      {questions.length > 0 ? (() => {
        const item = questions[currentQuestionIndex];
        if (!item) return null;
        const selected = selectedChoices[item.id];
        const isCorrect = results[item.id];
        const isScored = score !== null && selected !== undefined;

        return (
          <ScrollView style={styles.questionScrollView}>
            <View style={{ marginBottom: 24 }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 }}>
                <View style={{ marginRight: 8 }}>
                  {!isScored ? (
                    <Text>{item.number}.</Text>
                  ) : (
                    <View style={styles.markedNumberWrapper}>
                      <Image source={isCorrect ? redCircle : redX} style={styles.markImage} />
                      <Text style={styles.markedNumberText}>{item.number}</Text>
                    </View>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <HybridMathJax
                    latex={item.questionText}
                    display={false}
                  />
                </View>
              </View>

              {item.choices[0]?.type === 'table' && (
                <View style={{ flexDirection: 'row', marginBottom: 4 }}>
                  <View style={{ width: 30 }} />
                  {Object.keys(item.choices[0].content)
                    .filter(k => k !== 'number')
                    .map((header, idx) => (
                      <Text key={idx} style={{ width: 140, fontWeight: 'bold' }}>{header}</Text>
                    ))}
                </View>
              )}

              {item.choices.map((choice, index) => (
                <Pressable
                  key={index}
                  onPress={() => handleSelect(item.id, index)}
                  disabled={score !== null}
                  style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 }}
                >
                  <View style={{ width: 30, marginTop: 4, marginRight: 6 }}>
                    <View style={{
                      width: 20, height: 20, borderRadius: 10,
                      backgroundColor: selected === index ? '#000' : '#fff',
                      justifyContent: 'center', alignItems: 'center',
                    }}>
                      <Text style={{ color: selected === index ? '#fff' : '#000' }}>
                        {circledNumbers[index] ?? `(${index + 1})`}
                      </Text>
                    </View>
                  </View>
                  {choice.type === 'table' ? (
                    Object.entries(choice.content)
                      .filter(([key]) => key !== 'number')
                      .map(([_, value], i) => (
                        <Text key={i} style={{ width: 140 }}>{value}</Text>
                      ))
                  ) : (
                    <View style={{ flex: 1 }}>
                      <HybridMathJax latex={choice.content} display={false} />
                    </View>
                  )}
                </Pressable>
              ))}

             {score !== null && (
                <View style={{ marginTop: 6 }}>
                  <Text style={{ color: 'green', fontWeight: 'bold' }}>정답: {item.correctAnswer}</Text>
                  {item.explanation && <Text style={{ color: '#444', marginTop: 4 }}>해설: {item.explanation}</Text>}
                </View>
              )}
            </View>
          </ScrollView>
        );
      })() : (
          <View style={styles.loadingContainer}>
            <Text style={{ fontSize: 18 }}>문제를 준비 중입니다...</Text>
          </View>
        )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff' },
  subjectBox: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: '#000', paddingVertical: 8, paddingHorizontal: 16, marginBottom: 16,
  },
  centerTitle: { flex: 1, alignItems: 'center' },
  subjectText: { fontSize: 20, fontWeight: 'bold' },
  scoreText: { fontSize: 16, fontWeight: 'bold', color: 'red', marginHorizontal: 8 },
  submitButton: { backgroundColor: '#007AFF', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 4 },
  submitButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  markImage: { width: 70, height: 70, resizeMode: 'contain', position: 'absolute' },
  markedNumberWrapper: {
    width: 70, height: 70, marginRight: 8,
    justifyContent: 'center', alignItems: 'center', position: 'relative',
  },
  markedNumberText: { fontSize: 16, fontWeight: 'bold', color: '#d00', zIndex: 1 },
  navigationContainer: {
    marginBottom: 16,
  },
  navigatorScrollView: {
    paddingBottom: 8,
  },
  navigatorButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#eee',
    marginHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navigatorButtonActive: {
    backgroundColor: '#007AFF',
  },
  navigatorText: {
    color: '#000',
    fontSize: 16,
  },
  navigatorTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  navigationActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  navActionButton: {
    padding: 8,
  },
  navActionText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.4,
  },
  questionCounter: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  questionScrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

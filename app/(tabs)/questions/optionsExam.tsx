import { View, Text, FlatList, StyleSheet, Pressable, Image, Platform,Alert } from 'react-native';
import { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import HybridMathJax from '../../../components/HybridMathJax'; // 경로는 실제 위치에 맞게 수정


const EXPO_PUBLIC_API_KEY = process.env.EXPO_PUBLIC_API_KEY
const circledNumbers = ['①', '②', '③', '④', '⑤'];
const redCircle = require('../../../assets/red_circle.png');
const redX = require('../../../assets/red_x.png');

export default function TaxLawScreen() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedChoices, setSelectedChoices] = useState({});
  const [score, setScore] = useState(null);
  const [results, setResults] = useState({});

   const { subjectId, subjectName } = useLocalSearchParams();

  useEffect(() => {
  if (subjectId) {
    // 선택된 과목 정보 로그
    console.log("선택된 과목 ID:", subjectId);
    console.log("선택된 과목 이름:", subjectName);
  }
}, [subjectId]);

useEffect(() => {
  if (!subjectId) return;

  setLoading(true); // fetch 시작 시 로딩 처리

  fetch(`${EXPO_PUBLIC_API_KEY}/questions/${subjectId}`)
    .then((res) => res.json())
    .then((data) => {
      const parsed = data.map((item) => ({
        id: item[0],
        number: item[2],
        year: item[3],
        examType: item[4],
        questionText: item[5],
        choices: JSON.parse(item[6] ?? '[]'),
        correctAnswer: item[8],
        explanation: item[9],
      }));
      setQuestions(parsed);
      setLoading(false);
    })
    .catch((err) => {
      console.error('❌ 세법 문제 로딩 실패:', err);
      setLoading(false);
    });
}, [subjectId]);


  const handleSelect = (questionId, choiceIndex) => {
    if (score !== null) return; // 채점 후 비활성화
    setSelectedChoices((prev) => ({ ...prev, [questionId]: choiceIndex }));
  };

  const handleScore = () => {
    if (score !== null) return;
  
    // 웹,모바일 confirm 메시지 분기 처리
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('정답을 제출하시겠습니까? 제출 후에는 수정할 수 없습니다.');
      if (!confirmed) return;
      
      gradeQuestions(); 
    } else {
      Alert.alert(
        '정답 제출',
        '제출하시겠습니까? 제출 후에는 수정할 수 없습니다.',
        [
          { text: '취소', style: 'cancel' },
          { text: '제출', onPress: () => gradeQuestions() },
        ],
        { cancelable: false }
      );
    }
  };
  
  const gradeQuestions = () => {
    const gradedResults = {};
    let correctCount = 0;
  
    for (const question of questions) {
      const selectedIndex = selectedChoices[question.id];
      if (selectedIndex === undefined) continue;
      const correctIndex = parseInt(question.correctAnswer, 10) - 1;
      const isCorrect = selectedIndex === correctIndex;
      gradedResults[question.id] = isCorrect;
      if (isCorrect) correctCount += 1;
    }
  
    setResults(gradedResults);
    setScore(correctCount);
  };

  return (
    <View style={styles.container}>
      <View style={styles.subjectBox}>
        <View style={styles.centerTitle}>
          <Text style={styles.subjectText}>{subjectName}</Text>
        </View>
        {score !== null && (
          <Text style={styles.scoreText}>
            {score} / {questions.length}
          </Text>
        )}
        <Pressable
          style={[
            styles.submitButton,
            score !== null && { backgroundColor: '#ccc' },
          ]}
          onPress={handleScore}
          disabled={score !== null}
        >
          <Text style={styles.submitButtonText}>제출</Text>
        </Pressable>
      </View>

      {loading ? (
        <Text>불러오는 중...</Text>
      ) : (
        <FlatList
          data={questions}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => {
            const selected = selectedChoices[item.id];
            const isCorrect = results[item.id];
            const isScored = score !== null && selected !== undefined;

            const renderNumberMark = () => {
              if (!isScored) {
                return <Text>{item.number}.</Text>;
              }
              return isCorrect ? (
                <View style={styles.markedNumberWrapper}>
                  <Image source={redCircle} style={styles.markImage} />
                  <Text style={styles.markedNumberText}>{item.number}</Text>
                </View>
              ) : (
                <View style={styles.markedNumberWrapper}>
                  <Image source={redX} style={styles.markImage} />
                  <Text style={styles.markedNumberText}>{item.number}</Text>
                </View>
              );
            };

            return (
          <View style={{ marginBottom: 24 }}>
  {/* 문제번호 + 질문 수식 한 줄 정렬 */}
  <View
    style={{
      flexDirection: 'row',
      alignItems: 'flex-start',
      flexWrap: 'wrap',
      marginBottom: 8,
    }}
  >
    <View style={{ marginRight: 8 }}>
      {renderNumberMark()}
    </View>
    <View style={{ flex: 1 }}>
      <HybridMathJax latex={item.questionText} display={false} />
    </View>
  </View>

  {/* table 형 보기일 경우 헤더 */}
  {item.choices[0]?.type === 'table' && (
    <View style={{ flexDirection: 'row', marginBottom: 4 }}>
      <View style={{ width: 30 }} />
      {Object.keys(item.choices[0].content)
        .filter((k) => k !== 'number')
        .map((header, idx) => (
          <Text key={idx} style={{ width: 140, fontWeight: 'bold' }}>{header}</Text>
        ))}
    </View>
  )}

  {/* 보기 렌더링 */}
  {item.choices.map((choice, index) => {
    const symbol = circledNumbers[index] ?? `(${index + 1})`;
    const isSelected = selected === index;

    return (
      <Pressable
        key={choice.choice_index ?? index}
        onPress={() => handleSelect(item.id, index)}
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          marginBottom: 12,
        }}
        disabled={score !== null}
      >
        <View style={{ width: 30, marginTop: 4, marginRight: 6 }}>
          <View
            style={{
              width: 20,
              height: 20,
              borderRadius: 10,
              backgroundColor: isSelected ? '#000' : '#fff',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text style={{ color: isSelected ? '#fff' : '#000' }}>{symbol}</Text>
          </View>
        </View>

        {choice.type === 'table' ? (
          Object.entries(choice.content)
            .filter(([key]) => key !== 'number')
            .map(([_, value], idx) => (
              <Text key={idx} style={{ width: 140 }}>
                {typeof value === 'object' ? JSON.stringify(value) : value}
              </Text>
            ))
        ) : (
          <View style={{ flex: 1 }}>
            <HybridMathJax latex={choice.content} display={false} />
          </View>
        )}
      </Pressable>
    );
  })}

  {/* 정답 및 해설 */}
  {/* <Text style={{ color: 'green', fontWeight: 'bold' }}>✅ 정답: {item.correctAnswer}</Text>
  {item.explanation && (
    <Text style={{ color: '#444', marginTop: 4 }}>📘 해설: {item.explanation}</Text>
  )} */}
</View>

            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff' },
  subjectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#000',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  centerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  subjectText: { fontSize: 20, fontWeight: 'bold' },
  scoreText: { fontSize: 16, fontWeight: 'bold', color: 'red', marginHorizontal: 8 },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  submitButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  questionCard: { marginBottom: 32 },
  questionHeader: { flex: 1,flexDirection: 'row', alignItems: 'center' },
  questionText: { fontSize: 16, fontFamily: 'serif', lineHeight: 26, flex: 1 },
  questionNumber: { fontSize: 16, fontWeight: 'bold', marginRight: 4 },
  markImage: {
    width: 70,
    height: 70,
    resizeMode: 'contain',
    position: 'absolute',
  },
  markedNumberWrapper: {
    width: 70,
    height: 70,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  markedNumberText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#d00',
    zIndex: 1,
  },
  choiceRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  choiceTextWrapper: { flex: 1 },
  choiceText: { fontSize: 16, fontFamily: 'serif', lineHeight: 26 },
  symbolWrapper: { width: 30, alignItems: 'flex-start', marginTop: 4, marginRight: 6 },
  symbolBox: {
    width: 20,
    height: 20,
    borderRadius: 14,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  symbolBoxSelected: { backgroundColor: '#000' },
  symbolText: { fontSize: 16, fontFamily: 'serif', color: '#000' },
  symbolTextSelected: { fontSize: 16, fontFamily: 'serif', color: '#fff' },
  symbolBoxPlaceholder: { width: 28, height: 28, marginRight: 10 },
  tableRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  tableHeaderCell: { fontSize: 15, fontWeight: 'bold', fontFamily: 'serif', textAlign: 'center' },
  tableCell: { fontSize: 15, fontFamily: 'serif', textAlign: 'center' },
  answer: { fontSize: 15, marginTop: 12, fontWeight: 'bold', color: 'green' },
  explanation: { fontSize: 14, marginTop: 6, color: '#333', fontStyle: 'italic' },
});

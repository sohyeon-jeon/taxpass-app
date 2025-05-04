import { View, Text, FlatList, StyleSheet, Pressable } from 'react-native';
import { useEffect, useState } from 'react';
import Constants from 'expo-constants';

const EXPO_PUBLIC_API_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_API_URL;
const circledNumbers = ['①', '②', '③', '④', '⑤'];

export default function TaxLawScreen() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedChoices, setSelectedChoices] = useState({});

  useEffect(() => {
    fetch(`${EXPO_PUBLIC_API_URL}/questions/detail`)
      .then((res) => res.json())
      .then((data) => {
        const parsed = data.map((item) => ({
          id: item[0],
          number: item[2],
          year: item[3],
          examType: item[4],
          questionText: item[5],
          choices: JSON.parse(item[7] ?? '[]'),
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
  }, []);

  const handleSelect = (questionId, choiceIndex) => {
    setSelectedChoices((prev) => ({ ...prev, [questionId]: choiceIndex }));
  };

  return (
    <View style={styles.container}>
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

              {/* 테이블형 선지: 헤더 */}
              {item.choices[0]?.type === 'table' && (
                <View style={styles.tableRow}>
                  <View style={styles.symbolBoxPlaceholder} />
                  {Object.keys(item.choices[0].content)
                    .filter((k) => k !== '번호')
                    .map((header, idx) => (
                      <Text key={idx} style={[styles.tableHeaderCell, { width: 140 }]}>
                        {header}
                      </Text>
                    ))}
                </View>
              )}

              {/* 선지 렌더링 */}
              {item.choices.map((choice, index) => {
                const symbol = circledNumbers[index] ?? `(${index + 1})`;
                const selected = selectedChoices[item.id] === index;

                const symbolView = (
                  <View style={styles.symbolWrapper}>
                    <View
                      style={[styles.symbolBox, selected && styles.symbolBoxSelected]}
                    >
                      <Text
                        style={selected ? styles.symbolTextSelected : styles.symbolText}
                      >
                        {symbol}
                      </Text>
                    </View>
                  </View>
                );

                if (choice.type === 'table') {
                  return (
                    <Pressable
                      key={index}
                      onPress={() => handleSelect(item.id, index)}
                      style={styles.tableRow}
                    >
                      {symbolView}
                      {Object.entries(choice.content)
                        .filter(([key]) => key !== '번호')
                        .map(([_, value], idx) => (
                          <Text key={idx} style={[styles.tableCell, { width: 140 }]}>
                            {typeof value === 'object' ? JSON.stringify(value) : value}
                          </Text>
                        ))}
                    </Pressable>
                  );
                } else {
                  return (
                    <Pressable
                      key={choice.choice_index}
                      onPress={() => handleSelect(item.id, index)}
                      style={styles.choiceRow}
                    >
                      {symbolView}
                      <View style={styles.choiceTextWrapper}>
                        <Text style={styles.choiceText}>{choice.content}</Text>
                      </View>
                    </Pressable>
                  );
                }
              })}

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
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
  },
  subjectBox: {
    borderWidth: 1,
    borderColor: '#000',
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'center',
    marginBottom: 24,
  },
  subjectText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  questionCard: {
    marginBottom: 32,
  },
  questionText: {
    fontSize: 16,
    fontFamily: 'serif',
    lineHeight: 26,
    marginBottom: 12,
  },
  choiceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  choiceTextWrapper: {
    flex: 1,
  },
  choiceText: {
    fontSize: 16,
    fontFamily: 'serif',
    lineHeight: 26,
  },
  symbolWrapper: {
    width: 30,
    alignItems: 'flex-start',
    marginTop: 4,
    marginRight: 6,
  },
  symbolBox: {
    width: 20,
    height: 20,
    borderRadius: 14,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  symbolBoxSelected: {
    backgroundColor: '#000',
  },
  symbolText: {
    fontSize: 16,
    fontFamily: 'serif',
    color: '#000',
  },
  symbolTextSelected: {
    fontSize: 16,
    fontFamily: 'serif',
    color: '#fff',
  },
  symbolBoxPlaceholder: {
    width: 28,
    height: 28,
    marginRight: 10,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  tableHeaderCell: {
    fontSize: 15,
    fontWeight: 'bold',
    fontFamily: 'serif',
    textAlign: 'center',
  },
  tableCell: {
    fontSize: 15,
    fontFamily: 'serif',
    textAlign: 'center',
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
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';
import Constants from 'expo-constants';

const EXPO_PUBLIC_API_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_API_URL;

export default function TaxLawScreen() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${EXPO_PUBLIC_API_URL}/questions/detail`)
      .then((res) => res.json())
      .then((data) => {
        console.log('data',data)
        const parsed = data.map((item) => ({
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

              {/* Table Header */}
              {item.choices[0]?.type === 'table' && (
                <View style={styles.tableRow}>
                  <Text style={styles.tableSymbol}></Text> {/* 테이블헤더와 선지 정렬을 위해 빈칸 추가*/}
                  {Object.keys(item.choices[0].content)
                    .filter((k) => k !== '번호')
                    .map((header, idx) => (
                      <Text key={idx} style={[styles.tableHeaderCell, { width: 140 }]}>
                        {header}
                      </Text>
                    ))}
                </View>
              )}

              {/* Table Rows */}
              {item.choices.map((choice, index) => {
                if (choice.type === 'table') {
                  return (
                    <View key={index} style={styles.tableRow}>
                      <Text style={styles.tableSymbol}>{choice.content['번호']}</Text>
                      {Object.entries(choice.content)
                        .filter(([key]) => key !== '번호')
                        .map(([key, value], idx) => (
                          <Text key={idx} style={[styles.tableCell, { width: 140 }]}>
                            {value}
                          </Text>
                        ))}
                    </View>
                  );
                } else {
                  return (
                    <Text key={choice.choice_index} style={styles.choiceText}>
                      {`(${choice.choice_index}) ${choice.content}`}
                    </Text>
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
    fontSize: 17,
    fontWeight: 'bold',
    lineHeight: 26,
    marginBottom: 12,
    fontFamily: 'serif',
  },
  choiceText: {
    fontSize: 16,
    lineHeight: 28,
    marginBottom: 6,
    fontFamily: 'serif',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tableSymbol: {
    width: 28,
    fontSize: 14,
    fontFamily: 'serif',
    textAlign: 'center',
    marginRight: 8,
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

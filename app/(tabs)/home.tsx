import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';

const years = ['2024', '2023', '2022', '2021', '2020'];

export default function HomeScreen() {
  const handlePress = (year: string) => {
    console.log(`${year}년 기출문제 클릭됨`);
    // TODO: 해당 연도 문제 리스트 화면으로 이동 (라우팅 추가 예정)
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>연도별 기출문제</Text>
      <FlatList
        data={years}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => handlePress(item)}>
            <Text style={styles.cardText}>{item}년 기출문제</Text>
          </TouchableOpacity>
        )}
      />
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

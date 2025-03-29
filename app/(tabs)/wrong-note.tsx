import { View, Text, StyleSheet } from 'react-native';

export default function WrongNoteScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>오답노트</Text>
      <Text style={styles.text}>틀린 문제들이 여기에 저장될 예정입니다.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  text: {
    fontSize: 16,
    color: '#333',
  },
});

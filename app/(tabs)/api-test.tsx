import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import Constants from 'expo-constants';

export default function ApiTestScreen() {
  const API_URL = Constants.expoConfig?.extra?.API_URL;
  const [data, setData] = useState('');

  useEffect(() => {
    if (!API_URL) {
      setData("❌ API_URL이 설정되지 않았습니다.");
      return;
    }

    fetch(`${API_URL}/subjects`)
      .then((res) => res.text())
      .then((msg) => setData(msg))
      .catch((err) => {
        console.error("❌ API 요청 실패:", err);
        setData("❌ API 요청 실패");
      });
  }, []);

  return (
    <View>
      <Text>백엔드에서 받은 메시지:</Text>
      <Text>{data}</Text>
    </View>
  );
}

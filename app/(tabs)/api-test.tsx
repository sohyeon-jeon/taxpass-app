import { API_URL } from '@env';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';


export default function ApiTestScreen() {
  const [data, setData] = useState('');

  useEffect(() => {
    fetch(`${API_URL}`) 
      .then((res) => res.text())
      .then((msg) => setData(msg));
  }, []);

  return (
    <View>
      <Text>백엔드에서 받은 메시지:</Text>
      <Text>{data}</Text>
    </View>
  );
}
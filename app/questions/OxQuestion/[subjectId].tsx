import React from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, Pressable,
  Platform, Animated, Easing, ScrollView
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSession } from '../../../src/lib/SessionProvider';

// 타입 선언
type Question = {
  // id: number;
  question: string;
  answer: boolean;
  explanation: string;
};

export default function OxQuestion() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const rawSubjectId = params.subjectId;
  const rawSubjectName = params.subjectName;
  const { token } = useSession();

  // 과목Id 가져오기
  const subjectId = Array.isArray(rawSubjectId) ? rawSubjectId[0] : rawSubjectId;

  const subjectName = React.useMemo(() => {
    const v = Array.isArray(rawSubjectName) ? rawSubjectName[0] : rawSubjectName;
    if (!v) return '';
    try {
      return decodeURIComponent(String(v));
    } catch {
      return String(v);
    }
  }, [rawSubjectName]);

  const [questions, setQuestions] = React.useState<Question[]>([]);
  const [idx, setIdx] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [selected, setSelected] = React.useState<'O' | 'X' | null>(null);
  const [isCorrect, setIsCorrect] = React.useState<boolean | null>(null);

  const scaleO = React.useRef(new Animated.Value(1)).current;
  const scaleX = React.useRef(new Animated.Value(1)).current;

  const pressIn = (v: Animated.Value) =>
    Animated.timing(v, { toValue: 0.95, duration: 80, useNativeDriver: true, easing: Easing.out(Easing.quad) }).start();
  const pressOut = (v: Animated.Value) =>
    Animated.timing(v, { toValue: 1, duration: 80, useNativeDriver: true, easing: Easing.out(Easing.quad) }).start();

  React.useEffect(() => {
    const fetchQuestions = async () => {
      if (!subjectId) return;
      try {
        const baseUrl = process.env.EXPO_PUBLIC_API_KEY;
        const headers = new Headers();
        if (token) {
          headers.append('Authorization', `Bearer ${token}`);
        }
        const res = await fetch(`${baseUrl}/api/ox-questions/${subjectId}`, { headers });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: any[] = await res.json();
        const mapped: Question[] = data.map((row) => ({
          // id: row[0],
          question: row[2],
          answer: Boolean(row[3]),
          explanation: row[4] ?? '',
        }));
        setQuestions(mapped);
        setIdx(0);
      } catch (e) {
        console.error(e);
        setQuestions([]);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, [subjectId, token]);

  const progress = questions.length ? Math.round(((idx + 1) / questions.length) * 100) : 0;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.muted}>Loading questions…</Text>
      </View>
    );
  }
  if (!questions.length) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>No questions found</Text>
        <Text style={styles.muted}>Try a different subject.</Text>
      </View>
    );
  }
  if (idx >= questions.length) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>🎉 Completed!</Text>
        <Text style={styles.muted}>You solved all {questions.length} questions.</Text>
        <Pressable style={[styles.cta, { marginTop: 18 }]} onPress={() => router.back()}>
          <Text style={styles.ctaText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const current = questions[idx];

  const onAnswer = (val: 'O' | 'X') => {
    setSelected(val);
    const userChoice = val === 'O';
    const correct = userChoice === current.answer;
    setIsCorrect(correct);
  };

  const onNext = () => {
    setSelected(null);
    setIsCorrect(null);
    setIdx((prev) => prev + 1);
  };

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={styles.back}>{'‹'}</Text>
        </Pressable>

        <View style={styles.titleWrap}>
          <Text style={styles.headerTitle}>OX 퀴즈</Text>
          {!!subjectName && (
            <Text style={styles.subjectName} numberOfLines={1} ellipsizeMode="tail">
              {' · '}{subjectName}
            </Text>
          )}
        </View>

        <Text style={styles.counter}>{idx + 1}/{questions.length}</Text>
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>

      {/* Question card */}
      <View style={styles.cardWrap}>
        <View style={styles.card}>
          <Text style={styles.qNumber}>Q{idx + 1}</Text>
          <ScrollView contentContainerStyle={{ paddingBottom: 8 }} showsVerticalScrollIndicator={false}>
            <Text style={styles.qText}>{current.question}</Text>
          </ScrollView>
        </View>
      </View>

      {/* O / X buttons */}
      <View style={styles.oxRow}>
        <Pressable
          onPressIn={() => pressIn(scaleO)}
          onPressOut={() => pressOut(scaleO)}
          onPress={() => (selected ? null : onAnswer('O'))}
          disabled={!!selected}
          style={({ pressed }) => [
            styles.oxBase, styles.oxO, pressed ? styles.pressed : undefined,
            selected === 'O' ? styles.selectedBtn : undefined,
          ]}
        >
          <Animated.Text style={[styles.oxLabel, { transform: [{ scale: scaleO }] }]}>O</Animated.Text>
        </Pressable>

        <Pressable
          onPressIn={() => pressIn(scaleX)}
          onPressOut={() => pressOut(scaleX)}
          onPress={() => (selected ? null : onAnswer('X'))}
          disabled={!!selected}
          style={({ pressed }) => [
            styles.oxBase, styles.oxX, pressed ? styles.pressed : undefined,
            selected === 'X' ? styles.selectedBtn : undefined,
          ]}
        >
          <Animated.Text style={[styles.oxLabel, { transform: [{ scale: scaleX }] }]}>X</Animated.Text>
        </Pressable>
      </View>

      {/* Result & explanation */}
      {selected && (
        <View style={styles.resultWrap}>
          <View style={[styles.banner, isCorrect ? styles.bannerCorrect : styles.bannerWrong]}>
            <Text style={styles.bannerText}>{isCorrect ? '정답입니다!' : '오답입니다.'}</Text>
          </View>

          <Text style={styles.correctAnswerText}>정답: {current.answer ? 'O' : 'X'}</Text>

          <View style={styles.explainBox}>
            <Text style={styles.explainText}>{current.explanation}</Text>
          </View>
        </View>
      )}

      {/* Bottom CTA */}
      <View style={styles.bottomBar}>
        <Pressable style={[styles.cta, !selected && styles.ctaDisabled]} onPress={onNext} disabled={!selected}>
          <Text style={styles.ctaText}>{idx + 1 === questions.length ? '결과 보기' : '다음 문제'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F7F8FA', paddingTop: Platform.select({ ios: 14, android: 10, default: 8 }) },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 12 },
  back: { fontSize: 26, color: '#111' },
  titleWrap: { flexDirection: 'row', alignItems: 'center', maxWidth: '60%' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#111' },
  subjectName: { fontSize: 16, color: '#4B5563', marginLeft: 4 },
  counter: { fontSize: 14, color: '#6B7280' },

  progressTrack: { height: 8, backgroundColor: '#E5E7EB', borderRadius: 6, overflow: 'hidden', marginHorizontal: 18 },
  progressFill: { height: '100%', backgroundColor: '#2563EB' },

  cardWrap: { flex: 1, paddingHorizontal: 18, paddingTop: 16 },
  card: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 18, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  qNumber: { fontSize: 14, color: '#6B7280', marginBottom: 8 },
  qText: { fontSize: 20, lineHeight: 28, color: '#0F172A' },

  oxRow: { flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center', paddingHorizontal: 18, paddingTop: 16 },
  oxBase: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 3 },
  oxO: { backgroundColor: '#10B981' },
  oxX: { backgroundColor: '#EF4444' },
  oxLabel: { fontSize: 70, fontWeight: '700', color: '#fff' },

  selectedBtn: { opacity: 0.7 },
  pressed: { transform: [{ scale: 0.98 }] },

  resultWrap: { paddingHorizontal: 18, paddingTop: 16 },
  banner: { paddingVertical: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  bannerCorrect: { backgroundColor: '#DCFCE7' },
  bannerWrong: { backgroundColor: '#FEE2E2' },
  bannerText: { fontSize: 16, fontWeight: '600', color: '#111' },

  correctAnswerText: { marginTop: 6, fontSize: 16, fontWeight: '600', color: '#1F2937', textAlign: 'center' },
  explainBox: { marginTop: 10, backgroundColor: '#fff', borderRadius: 12, padding: 14, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
  explainText: { fontSize: 16, lineHeight: 24, color: '#111827' },

  bottomBar: { padding: 18 },
  cta: { backgroundColor: '#2563EB', paddingVertical: 16, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  ctaDisabled: { backgroundColor: '#93C5FD' },
  ctaText: { color: '#fff', fontSize: 18, fontWeight: '600' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  title: { fontSize: 22, fontWeight: '700', color: '#111' },
  muted: { marginTop: 8, color: '#6B7280' },
});

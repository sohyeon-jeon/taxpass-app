import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import * as XLSX from 'xlsx';

/* =====================
   타입 정의
===================== */
type Row = {
  main_theme: string;
  theme: string;
  question_title: string;
  question_text: string;
  answer: boolean;
  explanation: string;
};

type CellPos =
  | {
    row: number;
    col: keyof Row;
  }
  | null;

type SortState =
  | {
    col: keyof Row;
    direction: 'asc' | 'desc';
  }
  | null;

const toBooleanAnswer = (v: any): boolean => {
  if (v === true || v === 1) return true;

  const s = String(v ?? '').trim().toUpperCase();

  if (['O', '○', 'TRUE', 'T', 'Y', 'YES'].includes(s)) return true;
  if (['X', '×', 'FALSE', 'F', 'N', 'NO'].includes(s)) return false;

  return false;
};


/* =====================
   컴포넌트
===================== */
export default function OxQuestionUpload() {
  const [data, setData] = useState<Row[]>(
    Array.from({ length: 50 }).map(() => ({
      main_theme: '',
      theme: '',
      question_title: '',
      question_text: '',
      answer: false,
      explanation: '',
    }))
  );

  const [activeCell, setActiveCell] = useState<CellPos>(null);
  const [previewEndRow, setPreviewEndRow] = useState<number | null>(null);
  const [sortState, setSortState] = useState<SortState>(null);

  const dragStart = useRef<CellPos>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);


  // OCR 상태
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');

  // PDF + 페이지 입력 모달
  const [showModal, setShowModal] = useState(false);
  const [startPage, setStartPage] = useState('');
  const [endPage, setEndPage] = useState('');
  const [selectedPdf, setSelectedPdf] = useState<File | null>(null);


  const columns: (keyof Row)[] = [
    'main_theme',
    'theme',
    'question_title',
    'question_text',
    'answer',
    'explanation',
  ];

  const columnFlex: Record<keyof Row, number> = {
    main_theme: 1,
    theme: 1,
    question_title: 2,
    question_text: 3,
    answer: 0.6,
    explanation: 3,
  };

  const showPreparing = () => {
    if (Platform.OS === 'web') {
      window.alert('해당 기능은 준비 중입니다. 곧 제공될 예정이에요🙂');
    }
  };

  /* =====================
     셀 업데이트
  ===================== */
  const updateCell = <K extends keyof Row>(
    rowIndex: number,
    col: K,
    value: Row[K]
  ) => {
    setData(prev => {
      const next = [...prev];
      next[rowIndex] = { ...next[rowIndex], [col]: value };
      return next;
    });
  };

  /* =====================
     채우기 기능 (answer 제외)
  ===================== */
  const applyFill = () => {
    if (!dragStart.current || previewEndRow === null) return;

    const { row, col } = dragStart.current;
    if (col === 'answer') return;

    const value = data[row][col];
    if (previewEndRow <= row) return;

    setData(prev =>
      prev.map((r, idx) =>
        idx > row && idx <= previewEndRow
          ? { ...r, [col]: value }
          : r
      )
    );
  };

  /* =====================
     정렬
  ===================== */
  const toggleSort = (col: keyof Row) => {
    setSortState(prev => {
      if (!prev || prev.col !== col) {
        sortData(col, 'asc');
        return { col, direction: 'asc' };
      }
      if (prev.direction === 'asc') {
        sortData(col, 'desc');
        return { col, direction: 'desc' };
      }
      return null;
    });
  };

  const sortData = (col: keyof Row, dir: 'asc' | 'desc') => {
    setData(prev =>
      [...prev].sort((a, b) =>
        dir === 'asc'
          ? String(a[col]).localeCompare(String(b[col]))
          : String(b[col]).localeCompare(String(a[col]))
      )
    );
  };

  const renderSortIcon = (col: keyof Row) => {
    if (!sortState || sortState.col !== col) return '';
    return sortState.direction === 'asc' ? ' ▲' : ' ▼';
  };

  /* =====================
     엑셀 업로드
  ===================== */
  const handleOxUpload = () => {
    if (Platform.OS === 'web') {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = evt => {
      const binary = evt.target?.result;
      if (!binary) return;

      const workbook = XLSX.read(binary, { type: 'binary' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];

      const json: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

      const rows: Row[] = json.map(row => ({
        main_theme: row['대주제'] ?? '',
        theme: row['소주제'] ?? '',
        question_title: row['문제제목'] ?? '',
        question_text: row['문제내용'] ?? '',
        answer: toBooleanAnswer(row['정답']),

        explanation: row['해설'] ?? '',
      }));

      setData(rows);

      e.target.value = '';
    };

    reader.readAsBinaryString(file);
  };

  const handlePdfUpload = () => {
    if (Platform.OS !== 'web') return;

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf';

    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setSelectedPdf(file);     // 파일 저장
      setStartPage('');         // 입력 초기화
      setEndPage('');
      setShowModal(true);       // 페이지 입력 모달 열기
    };

    input.click();
  };

  const startUpload = async () => {
    if (!selectedPdf) return;

    // 숫자 검증
    const s = Number(startPage);
    const e = Number(endPage);

    if (!Number.isFinite(s) || !Number.isFinite(e) || s <= 0 || e <= 0 || s > e) {
      alert('시작/끝 페이지를 올바르게 입력하세요 (예: 1 ~ 10)');
      return;
    }

    try {
      setShowModal(false);
      setUploading(true);
      setProgress(0);
      setProgressMessage('업로드 중...');

      setData(
        Array.from({ length: 50 }).map(() => ({
          main_theme: '',
          theme: '',
          question_title: '',
          question_text: '',
          answer: false,
          explanation: '',
        }))
      );

      const formData = new FormData();
      formData.append('file', selectedPdf);
      formData.append('startPage', String(s));
      formData.append('endPage', String(e));

      const res = await fetch(`${process.env.EXPO_PUBLIC_API_KEY}/api/ocr/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`upload failed: ${res.status} ${text}`);
      }

      const result = await res.json();   
      pollProgress(result.jobId);       
    } catch (err) {
      console.error(err);
      alert('업로드 실패');
      setUploading(false);
    }
  };


  const pollProgress = (jobId: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `${process.env.EXPO_PUBLIC_API_KEY}/api/ocr/progress/${jobId}`
        );

        if (!res.ok) throw new Error(`progress failed: ${res.status}`);

        const result = await res.json(); // { progress: number, message: string }

        setProgress(result.progress ?? 0);
        setProgressMessage(result.message ?? '');

        if ((result.progress ?? 0) >= 100) {
          clearInterval(interval);
          setUploading(false);

          if (result.result) {
            const jsonData =
              typeof result.result === 'string'
                ? JSON.parse(result.result)
                : result.result;

            const rows: Row[] = jsonData.map((item: any) => ({
              main_theme: '',
              theme: '',
              question_title: '',
              question_text: item.question_text ?? '',
              answer: toBooleanAnswer(item.answer),
              explanation: item.explanation ?? '',
            }));

            setData(rows);
          }

          alert('OCR 작업이 성공적으로 완료되었습니다.');
        }
      } catch (err) {
        console.error(err);
        clearInterval(interval);
        setUploading(false);
        alert('진행 상황 조회 중 오류가 발생했습니다.');
      }
    }, 1000);
  };






  const columnLabels: Record<keyof Row, string> = {
    main_theme: '대주제',
    theme: '소주제',
    question_title: '문제제목',
    question_text: '문제내용',
    answer: '정답',
    explanation: '해설',
  };

  /* =====================
     렌더
  ===================== */
  return (


    <View style={{ flex: 1, backgroundColor: '#fff', }}>
      {/* 🔥 페이지 입력 모달 */}
      {showModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>OCR 페이지 설정</Text>

            <TextInput
              placeholder="시작 페이지"
              value={startPage}
              onChangeText={setStartPage}
              keyboardType="numeric"
              style={styles.modalInput}
            />

            <TextInput
              placeholder="끝 페이지"
              value={endPage}
              onChangeText={setEndPage}
              keyboardType="numeric"
              style={styles.modalInput}
            />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable
                style={styles.modalCancel}
                onPress={() => setShowModal(false)}
              >
                <Text>취소</Text>
              </Pressable>

              <Pressable
                style={styles.modalConfirm}
                onPress={startUpload}
              >
                <Text style={{ color: '#fff' }}>시작</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
      {/* 상단 헤더 */}

      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={styles.pageTitle}>OX 문제 업로드</Text>

        <View style={styles.teacherBadge}>
          <Text style={styles.teacherBadgeText}>관리자 전용 화면</Text>
        </View>
      </View>

      {uploading && (
        <View style={styles.progressWrapper}>
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
          </View>
          <Text style={{ marginTop: 6, fontSize: 12 }}>
            {progress}% · {progressMessage}
          </Text>
        </View>
      )}


      <View style={styles.gridHeader}>
        <Pressable style={styles.uploadButton} onPress={handleOxUpload} disabled={uploading}>
          <Text style={styles.uploadButtonText}>엑셀 업로드</Text>
        </Pressable>

        <Pressable style={styles.uploadButton} onPress={handlePdfUpload} disabled={uploading}>
          <Text style={styles.uploadButtonText}>PDF 업로드</Text>
        </Pressable>

        <Pressable style={styles.subButton} onPress={showPreparing} disabled={uploading}>
          <Text style={styles.subButtonText}>저장</Text>
        </Pressable>

      </View>

      {Platform.OS === 'web' && (
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      )}


      {/* 테이블 */}
      <View
        style={[
          styles.sheet,
          uploading && { opacity: 0.4, pointerEvents: 'none' }
        ]}
      >

        <ScrollView style={styles.body}>
          <View style={{ padding: 12 }}>
            {/* Header */}
            <View style={[styles.row, styles.headerRow]}>
              {columns.map(col => (
                <Pressable
                  key={col}
                  style={[
                    styles.cell,
                    styles.header,
                    { flex: columnFlex[col] },
                  ]}
                  onPress={() => toggleSort(col)}
                >
                  <Text style={styles.headerText}>
                    {columnLabels[col]}
                    {renderSortIcon(col)}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Body */}
            {data.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.row}>
                {columns.map(col => {
                  const isActive =
                    activeCell?.row === rowIndex &&
                    activeCell?.col === col;

                  const isPreview =
                    dragStart.current &&
                    previewEndRow !== null &&
                    dragStart.current.col === col &&
                    rowIndex > dragStart.current.row &&
                    rowIndex <= previewEndRow;

                  return (
                    <View
                      key={col}
                      style={[
                        styles.cell,
                        { flex: columnFlex[col] },
                        isActive && styles.activeCell,
                        isPreview && styles.previewCell,
                      ]}
                      onMouseEnter={
                        Platform.OS === 'web'
                          ? () => setPreviewEndRow(rowIndex)
                          : undefined
                      }
                    >
                      {col === 'answer' ? (
                        <Pressable
                          style={styles.checkboxWrapper}
                          onPress={() =>
                            !uploading && updateCell(rowIndex, 'answer', !row.answer)
                          }
                        >
                          <View
                            style={[
                              styles.checkbox,
                              row.answer && styles.checkboxChecked,
                            ]}
                          >
                            {row.answer && (
                              <Text style={styles.checkMark}>✓</Text>
                            )}
                          </View>
                        </Pressable>
                      ) : (
                        <TextInput
                          value={row[col]}
                          editable={!uploading}
                          onFocus={() =>
                            setActiveCell({ row: rowIndex, col })
                          }
                          onChangeText={v =>
                            updateCell(rowIndex, col, v)
                          }
                          style={styles.input}
                        />
                      )}

                      {isActive && col !== 'answer' && (
                        <Pressable
                          style={styles.fillHandle}
                          onPressIn={() => {
                            dragStart.current = { row: rowIndex, col };
                            setPreviewEndRow(rowIndex);
                          }}
                          onPressOut={() => {
                            applyFill();
                            dragStart.current = null;
                            setPreviewEndRow(null);
                          }}
                        />
                      )}
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

/* =====================
   스타일
===================== */
const styles = StyleSheet.create({
  gridHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
    marginRight: 30,
    gap: 8,
  },

  headerRow: {
    // paddingRight: 18, // 스크롤바 너비 보정은 이제 별도의 View로 처리
  },

  teacherBadge: {
    marginLeft: 12,
    backgroundColor: '#edf2ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },

  teacherBadgeText: {
    fontSize: 12,
    color: '#2a62ff',
    fontWeight: '600',
  },


  pageTitle: {
    fontSize: 30,
    fontWeight: '900',
    marginTop: 10,
    marginLeft: 20,
  },

  subButton: {
    borderWidth: 1,
    borderColor: '#d0d0d0',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 6,
    backgroundColor: '#fff',
  },

  subButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#444',
  },


  uploadButton: {
    backgroundColor: '#2a62ff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
  },
  uploadButtonText: {
    color: '#fff',
    fontWeight: '700',
  },

  sheet: {
    // marginTop: 150,
    // padding: 12,
    backgroundColor: '#fdfdfd',
  },
  body: {
    maxHeight: 850,
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    height: 40,
    borderWidth: 1,
    borderColor: '#d0d0d0',
    paddingHorizontal: 6,
    justifyContent: 'center',
    backgroundColor: '#fff',
    position: 'relative',
  },
  header: {
    backgroundColor: '#f3f3f3',
    alignItems: 'center',
  },
  headerText: {
    fontWeight: '600',
    fontSize: 13,
  },
  input: {
    padding: 0,
    fontSize: 14,
    outlineStyle: 'none',
    backgroundColor: 'transparent',
  },

  checkboxWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkbox: {
    width: 16,
    height: 16,
    borderWidth: 1.5,
    borderColor: '#444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#2a62ff',
    borderColor: '#2a62ff',
  },
  checkMark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },

  activeCell: {
    borderColor: '#2a62ff',
    borderWidth: 2,
  },
  previewCell: {
    backgroundColor: '#edf2ff',
    borderColor: '#2a62ff',
  },
  fillHandle: {
    position: 'absolute',
    width: 8,
    height: 8,
    right: -4,
    bottom: -4,
    backgroundColor: '#2a62ff',
  },

  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },

  modalContainer: {
    width: 300,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
  },

  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },

  modalInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 10,
    borderRadius: 6,
  },

  modalCancel: {
    flex: 1,
    padding: 10,
    backgroundColor: '#eee',
    alignItems: 'center',
    borderRadius: 6,
  },

  modalConfirm: {
    flex: 1,
    padding: 10,
    backgroundColor: '#2a62ff',
    alignItems: 'center',
    borderRadius: 6,
  },

  progressWrapper: {
    marginHorizontal: 30,
    marginTop: 20,
  },

  progressBarBackground: {
    height: 10,
    backgroundColor: '#eee',
    borderRadius: 10,
    overflow: 'hidden',
  },

  progressBarFill: {
    height: '100%',
    backgroundColor: '#2a62ff',
  },
  disabledButton: {
    opacity: 0.5,
  },

});

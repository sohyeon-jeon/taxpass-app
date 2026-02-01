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
        answer: ['O', 'TRUE', 1, true].includes(row['정답']),
        explanation: row['해설'] ?? '',
      }));

      setData(rows);
    };

    reader.readAsBinaryString(file);
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
      {/* 상단 헤더 */}

      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={styles.pageTitle}>OX 문제 업로드</Text>

        <View style={styles.teacherBadge}>
          <Text style={styles.teacherBadgeText}>관리자 전용 화면</Text>
        </View>
      </View>

      <View style={styles.gridHeader}>
        <Pressable style={styles.uploadButton} onPress={handleOxUpload}>
          <Text style={styles.uploadButtonText}>엑셀 업로드</Text>
        </Pressable>

        <Pressable style={styles.uploadButton} onPress={showPreparing}>
          <Text style={styles.uploadButtonText}>PDF 업로드</Text>
        </Pressable>

        <Pressable style={styles.subButton} onPress={showPreparing}>
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
      <View style={styles.sheet}>
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
        <ScrollView style={styles.body}>
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
                          updateCell(rowIndex, 'answer', !row.answer)
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
    paddingRight: 18,
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
    padding: 12,
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
});

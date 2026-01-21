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

  const columnWidths: Record<keyof Row, number> = {
    main_theme: 250,
    theme: 250,
    question_title: 500,
    question_text: 700,
    answer: 80,
    explanation: 600,
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

  /* =====================
     렌더
  ===================== */
  return (
    <ScrollView horizontal>
      <View>
        {/* 상단 헤더 */}
        <View style={styles.topHeader}>
          <Text style={styles.pageTitle}>OX 문제</Text>

          <Pressable style={styles.uploadButton} onPress={handleOxUpload}>
            <Text style={styles.uploadButtonText}>OX 문제 업로드</Text>
          </Pressable>

          {Platform.OS === 'web' && (
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          )}
        </View>

        {/* 테이블 */}
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.row}>
            {columns.map(col => (
              <Pressable
                key={col}
                style={[
                  styles.cell,
                  styles.header,
                  { width: columnWidths[col] },
                ]}
                onPress={() => toggleSort(col)}
              >
                <Text style={styles.headerText}>
                  {col.toUpperCase()}
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
                        { width: columnWidths[col] },
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
    </ScrollView>
  );
}

/* =====================
   스타일
===================== */
const styles = StyleSheet.create({
  topHeader: {
    position: 'absolute',
    top: 40,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  pageTitle: {
    fontSize: 30,
    fontWeight: '900',
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
    marginTop: 150,
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

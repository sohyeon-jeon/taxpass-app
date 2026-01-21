import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Platform,
} from 'react-native';

type Row = {
  col1: string;
  col2: string;
  col3: string;
};

type CellPos = {
  row: number;
  col: keyof Row;
} | null;

type SortState = {
  col: keyof Row;
  direction: 'asc' | 'desc';
} | null;

export default function oxQuestionUpload() {
  const [data, setData] = useState<Row[]>(
    Array.from({ length: 50 }).map((_, i) => ({
      col1: i === 0 ? 'A1' : '',
      col2: 'B1',
      col3: 'C1',
    }))
  );

  const [activeCell, setActiveCell] = useState<CellPos>(null);
  const [previewEndRow, setPreviewEndRow] = useState<number | null>(null);
  const [sortState, setSortState] = useState<SortState>(null);

  const dragStart = useRef<CellPos>(null);

  const columns: (keyof Row)[] = ['col1', 'col2', 'col3'];

  /** 컬럼별 너비 정의 */
  const columnWidths: Record<keyof Row, number> = {
    col1: 500,
    col2: 600,
    col3: 600,
  };

  /* 셀 업데이트 */
  const updateCell = (row: number, col: keyof Row, value: string) => {
    setData(prev => {
      const next = [...prev];
      next[row] = { ...next[row], [col]: value };
      return next;
    });
  };

  /* 채우기 기능 */
  const applyFill = () => {
    if (!dragStart.current || previewEndRow === null) return;

    const { row, col } = dragStart.current;
    const value = data[row][col];

    if (!value || previewEndRow <= row) return;

    setData(prev =>
      prev.map((r, idx) =>
        idx > row && idx <= previewEndRow
          ? { ...r, [col]: value }
          : r
      )
    );
  };

  /* 정렬 */
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
          ? a[col].localeCompare(b[col])
          : b[col].localeCompare(a[col])
      )
    );
  };

  const renderSortIcon = (col: keyof Row) => {
    if (!sortState || sortState.col !== col) return '';
    return sortState.direction === 'asc' ? ' ▲' : ' ▼';
  };

  return (
    <ScrollView
      horizontal
      contentContainerStyle={{
        minWidth: '100%',
        justifyContent: 'center',
      }}
    >
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

                    {isActive && (
                      <Pressable
                        style={styles.fillHandle}
                        onPressIn={() => {
                          dragStart.current = {
                            row: rowIndex,
                            col,
                          };
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  sheet: {
    alignSelf: 'center',
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
    color: '#444',
  },
  input: {
    padding: 0,
  fontSize: 14,
  color: '#222',
  borderWidth: 0,
  outlineStyle: 'none',   
  backgroundColor: 'transparent',
  },
  activeCell: {
    borderColor: '#2a62ff',
    borderWidth: 2,
    zIndex: 2,
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
    borderRadius: 1,
    cursor: Platform.OS === 'web' ? 'crosshair' : 'default',
  },
});

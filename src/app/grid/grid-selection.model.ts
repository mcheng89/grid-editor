export interface GridSelectionOffset {
  row: number;
  col: number;
  top?: number;
  left?: number;
  width?: number;
  height?: number;
}
export interface GridSelectionRange {
  type: string;
  startCell: GridSelectionOffset;
  endCell: GridSelectionOffset;
  top?: number;
  left?: number;
  width?: number;
  height?: number;
  minRow?: number;
  maxRow?: number;
  minCol?: number;
  maxCol?: number;
}
export interface GridSelectionChange {
  focus: GridSelectionOffset;
  ranges: GridSelectionRange[];
  rows: boolean[];
  cols: boolean[];
  cells: boolean[][];
}

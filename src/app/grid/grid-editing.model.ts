import { GridColumnComponent } from './grid-column.component';

import { GridSelectionRange } from './grid-selection.model';

export interface GridEditTarget {
  row: number;
  col: number;
  element?: HTMLElement;
  data?: any;
  column?: GridColumnComponent;
  value?: any;
}
export interface GridEditDataRowChange {
  row: number;
  data: any;
}
export interface GridEditDataChange {
  source: string;
  changes: GridEditDataRowChange[];
}
export interface GridEditCopyEvent {
  data: any[];
  selection: GridSelectionRange[];
}
export interface GridEditPasteEvent {
  data: any[];
  selection: GridSelectionRange[];
  cancel: boolean;
}

import { Component, Input, Output, EventEmitter, AfterViewInit, ElementRef } from '@angular/core';

import { GridColumnComponent } from './grid-column.component';

@Component({
  selector: 'grid-selection',
  template: '',
})
export class GridSelectionComponent implements AfterViewInit {
  @Input() gridElementRef: ElementRef;
  @Input() columns: GridColumnComponent[];
  @Input() data: any[];
  @Input() rowHeights: number[];

  @Output() selection = new EventEmitter<any>();
  @Output() focusChanging = new EventEmitter<any>();

  ngAfterViewInit() {
    this.gridElementRef.nativeElement.addEventListener('mousedown', this.selectionStart.bind(this));
    this.gridElementRef.nativeElement.addEventListener('mousemove', this.selectionMove.bind(this));
    document.addEventListener('mouseup', this.selectionEnd.bind(this));

    this.gridElementRef.nativeElement.addEventListener('keydown', this.moveFocus.bind(this));
  }

  focusCell: any;
  currentSelection: any;
  selectionRanges: any[] = [];
  selectionCols: boolean[] = [];
  selectionRows: boolean [] = [];
  selectionCells: boolean[][] = [[]];

  selectionStart(event) {
    const target = this.getSelectionTarget(event);
    if (target && target.tagName == "TD") {
      const type = target.dataset.type;
      this.focusCell = this.getOffset(
        type != "col" ? parseInt(target.parentNode.dataset.row) : 0, 
        type != "row" ? parseInt(target.dataset.col) : 0);
      let endCell = this.focusCell;
      if (type != "cell") {
        endCell = this.getOffset(
          type == "row" ? parseInt(target.parentNode.dataset.row) : this.data.length - 1, 
          type == "col" ? parseInt(target.dataset.col) : this.columns.length - 1);
      }
      this.currentSelection = this.createSelection(this.focusCell, endCell, type);
      this.setSelectionRange(this.currentSelection);
    }
  }
  createSelection(startCell, endCell, type) {
    return {
      type: type,
      startCell: startCell,
      endCell: endCell,
    };
  }
  selectionMove(event) {
    if (!this.currentSelection) {
      return;
    }
    const target = this.getSelectionTarget(event);
    if (target && target.tagName == "TD" && this.currentSelection.endCell != target) {
      if (this.currentSelection.type == "cell" && target.dataset.type != "cell") {
        return;
      }
      const startType = this.currentSelection.type;
      const endOffset = this.getOffset(
        startType != "col" ? parseInt(target.parentNode.dataset.row) : this.data.length - 1, 
        startType != "row" ? parseInt(target.dataset.col) : this.columns.length - 1);
      this.currentSelection.endCell = endOffset;
      this.setSelectionRange(this.currentSelection);
    }
  }
  selectionEnd(event) {
    this.currentSelection = null;
  }
  setSelectionRange(range) {
    this.deselect();

    if (range.startCell.left < range.endCell.left) {
      range.left = range.startCell.left;
      range.width = range.endCell.left - range.startCell.left + range.endCell.width;
    } else {
      range.left = range.endCell.left;
      range.width = range.startCell.left - range.endCell.left + range.startCell.width;
    }
    if (range.startCell.top <= range.endCell.top) {
      range.top = range.startCell.top;
      range.height = range.endCell.top - range.startCell.top + range.endCell.height;
    } else {
      range.top = range.endCell.top;
      range.height = range.startCell.top - range.endCell.top + range.startCell.height;
    }
    this.selectionRanges = [range];

    const minRow = range.type != "col" ? Math.min(range.startCell.row, range.endCell.row) : 0;
    const maxRow = range.type != "col" ? Math.max(range.startCell.row, range.endCell.row) : this.data.length - 1;
    const minCol = range.type != "row" ? Math.min(range.startCell.col, range.endCell.col) : 0;
    const maxCol = range.type != "row" ? Math.max(range.startCell.col, range.endCell.col) : this.columns.length - 1;
    for (let rowIdx = minRow; rowIdx <= maxRow; rowIdx++) {
      this.selectionRows[rowIdx] = true;
      for (let colIdx = minCol; colIdx <= maxCol; colIdx++) {
        this.selectionCells[rowIdx][colIdx] = true;
        this.selectionCols[colIdx] = true;
      }
    }

    this.selection.emit({
      focus: this.focusCell,
      ranges: this.selectionRanges,
      rows: this.selectionRows,
      cols: this.selectionCols,
      cells: this.selectionCells,
    });
  }
  deselect() {
    this.selectionCells = this.data.map(row => this.columns.map(col => false));
    this.selectionCols = this.columns.map(col => false);
    this.selectionRows = this.data.map(row => false);
    this.selectionRanges = [];
  }
  
  moveFocus(event) {
    let cancelableEvent = {cancel: false};
    this.focusChanging.emit(cancelableEvent);

    if (cancelableEvent.cancel || !this.focusCell) {
      // when in editing mode. let the editor have keyboard control
      return;
    }

    const row = this.focusCell.row;
    const col = this.focusCell.col;
    let newFocusCell;
    if (event.key == "ArrowUp" || event.key == "Up") {
      if (row <= 0) return;
      newFocusCell = this.getOffset(row - 1, col);
    } else if (event.key == "ArrowDown" || event.key == "Down") {
      if (row >= this.data.length - 1) return;
      newFocusCell = this.getOffset(row + 1, col);
    } else if (event.key == "ArrowLeft" || event.key == "Left") {
      if (col <= 0) return;
      newFocusCell = this.getOffset(row, col - 1);
    } else if (event.key == "ArrowRight" || event.key == "Right") {
      if (col >= this.columns.length - 1) return;
      newFocusCell = this.getOffset(row, col + 1);
    }
    if (newFocusCell) {
      this.focusCell = newFocusCell;
      // this.gridRef.nativeElement.focus();
      // this.scrollCellToView(this.focusCell);
      this.setSelectionRange(this.createSelection(this.focusCell, this.focusCell, "cell"));
    }
  }

  getSelectionTarget(event) {
    let target = event.target;
    while (target && target != this.gridElementRef.nativeElement && target.tagName != "TD" && !target.classList.contains("ge-no-select")) {
      target = target.parentNode;
    }
    return target;
  }
  getOffset(row, col) {
    // using offset height forces a rerender/performance hit
    let top = 0;
    for (let i=0; i<row; i++) {
      top += this.rowHeights[i];
    }
    let left = 0;
    for (let i=0; i<col; i++) {
      left += this.columns[i].renderedWidth;
    }
    return {
      row: row,
      col: col,
      top: top,
      left: left,
      height: this.rowHeights[row],
      width: this.columns[col].renderedWidth,
    };
  }

}

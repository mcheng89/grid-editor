import { Component, Input, Output, EventEmitter, AfterViewInit, ElementRef, OnChanges, SimpleChanges } from '@angular/core';

import { GridColumnComponent } from './grid-column.component';
import { GridSelectionService } from './grid-selection.service';

@Component({
  selector: 'grid-selection',
  template: '',
})
export class GridSelectionComponent implements AfterViewInit, OnChanges {
  @Input() gridElementRef: ElementRef;
  @Input() columns: GridColumnComponent[];
  @Input() rowHeights: number[];

  @Output() selection = new EventEmitter<any>();
  @Output() focusChanging = new EventEmitter<any>();

  constructor(private gridSelectionSvc: GridSelectionService) {
    this.gridSelectionSvc.onFocusChange(this).subscribe(newFocusCell => this.setFocusCell(newFocusCell));
  }

  ngAfterViewInit() {
    this.gridElementRef.nativeElement.addEventListener('mousedown', this.selectionStart.bind(this));
    this.gridElementRef.nativeElement.addEventListener('mousemove', this.selectionMove.bind(this));
    document.addEventListener('mouseup', this.selectionEnd.bind(this));

    this.gridElementRef.nativeElement.addEventListener('keydown', this.moveFocus.bind(this));
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.rowHeights && this.focusCell) {
      this.setSelectionSizes();
      this.selection.emit({
        focus: this.focusCell,
        ranges: this.selectionRanges,
        rows: this.selectionRows,
        cols: this.selectionCols,
        cells: this.selectionCells,
      });
    }
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
      this.focusCell = {
        row: type != "col" ? parseInt(target.parentNode.dataset.row) : 0, 
        col: type != "row" ? parseInt(target.dataset.col) : 0,
      };
      let endCell = this.focusCell;
      if (type != "cell") {
        endCell = {
          row: type == "row" ? parseInt(target.parentNode.dataset.row) : this.rowHeights.length - 1, 
          col: type == "col" ? parseInt(target.dataset.col) : this.columns.length - 1,
        };
      }
      this.gridSelectionSvc.setFocusCell(this, this.focusCell);
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
    if (target && target.tagName == "TD") {
      if (this.currentSelection.type == "cell" && target.dataset.type != "cell") {
        return;
      }
      const startType = this.currentSelection.type;
      const endOffset = {
        row: startType != "col" ? parseInt(target.parentNode.dataset.row) : this.rowHeights.length - 1, 
        col: startType != "row" ? parseInt(target.dataset.col) : this.columns.length - 1,
      };
      if (endOffset.row == this.currentSelection.endCell.row 
        && endOffset.col == this.currentSelection.endCell.col) {
        return;
      }
      this.currentSelection.endCell = endOffset;
      this.setSelectionRange(this.currentSelection);
    }
  }
  selectionEnd(event) {
    this.currentSelection = null;
  }
  setSelectionRange(range) {
    this.deselect();
    this.selectionRanges = [range];

    range.minRow = range.type != "col" ? Math.min(range.startCell.row, range.endCell.row) : 0;
    range.maxRow = range.type != "col" ? Math.max(range.startCell.row, range.endCell.row) : this.rowHeights.length - 1;
    range.minCol = range.type != "row" ? Math.min(range.startCell.col, range.endCell.col) : 0;
    range.maxCol = range.type != "row" ? Math.max(range.startCell.col, range.endCell.col) : this.columns.length - 1;
    for (let rowIdx = range.minRow; rowIdx <= range.maxRow; rowIdx++) {
      this.selectionRows[rowIdx] = true;
      for (let colIdx = range.minCol; colIdx <= range.maxCol; colIdx++) {
        this.selectionCells[rowIdx][colIdx] = true;
        this.selectionCols[colIdx] = true;
      }
    }

    this.setSelectionSizes();

    this.selection.emit({
      focus: this.focusCell,
      ranges: this.selectionRanges,
      rows: this.selectionRows,
      cols: this.selectionCols,
      cells: this.selectionCells,
    });
  }
  deselect() {
    this.selectionCells = this.rowHeights.map(row => this.columns.map(col => false));
    this.selectionCols = this.columns.map(col => false);
    this.selectionRows = this.rowHeights.map(row => false);
    this.selectionRanges = [];
  }
  
  moveFocus(event) {
    if (!this.gridSelectionSvc.keyboardFocusChanging() || !this.focusCell) {
      // when in editing mode. let the editor have keyboard control
      return;
    }

    const row = this.focusCell.row;
    const col = this.focusCell.col;
    let newFocusCell;
    if (event.key == "ArrowUp" || event.key == "Up") {
      if (row <= 0) return;
      newFocusCell = {row: row - 1, col: col};
    } else if (event.key == "ArrowDown" || event.key == "Down") {
      if (row >= this.rowHeights.length - 1) return;
      newFocusCell = {row: row + 1, col: col};
    } else if (event.key == "ArrowLeft" || event.key == "Left" || (event.key == "Tab" && event.shiftKey)) {
      event.preventDefault();
      if (col <= 0) return;
      newFocusCell = {row: row, col: col - 1};
    } else if (event.key == "ArrowRight" || event.key == "Right" || event.key == "Tab") {
      event.preventDefault();
      if (col >= this.columns.length - 1) return;
      newFocusCell = {row: row, col: col + 1};
    }
    if (newFocusCell) {
      this.gridSelectionSvc.setFocusCell(this, newFocusCell);
      this.setFocusCell(newFocusCell);
    }
  }
  setFocusCell(cell) {
    this.focusCell = cell;
    this.setSelectionRange(this.createSelection(this.focusCell, this.focusCell, "cell"));
  }

  setSelectionSizes() {
    this.focusCell = this.getOffset(this.focusCell.row, this.focusCell.col);
    this.selectionRanges.forEach(range => {
      range.startCell = this.getOffset(range.startCell.row, range.startCell.col);
      range.endCell = this.getOffset(range.endCell.row, range.endCell.col);

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
    });
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

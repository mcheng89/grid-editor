import { Component, Input, Output, EventEmitter, ContentChildren, ViewChild, QueryList, ElementRef, AfterContentInit, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';

import { GridColumnComponent } from './grid-column.component';

@Component({
  selector: 'grid-editor',
  templateUrl: './grid-editor.component.html',
  styleUrls: ['./grid-editor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GridEditorComponent implements AfterContentInit, AfterViewInit {
  @Input() data: any[];
  @ContentChildren(GridColumnComponent) columnRefs: QueryList<GridColumnComponent>;
  columns: GridColumnComponent[] = [];
  fixedColumns: GridColumnComponent[] = [];
  
  constructor(private elementRef: ElementRef, private cdr: ChangeDetectorRef) {}
  
  ngAfterContentInit() {
    this.columns = this.columnRefs.filter(col => !col.fixed);
    this.fixedColumns = this.columnRefs.filter(col => col.fixed);
  }
  ngAfterViewInit() {
    this.initSelectionGrid();
    this.resizeColHeaders();
    this.cdr.detectChanges();
    setTimeout(() => {
      this.resizeRowHeaders();
      this.cdr.detectChanges();
    });
    
    this.elementRef.nativeElement.addEventListener('selectstart', (event) => {
      event.preventDefault();
    });
    this.tableScrollRef.nativeElement.addEventListener('scroll', this.onScroll.bind(this));

    this.elementRef.nativeElement.addEventListener('mousedown', this.selectionStart.bind(this));
    this.elementRef.nativeElement.addEventListener('mousemove', this.selectionMove.bind(this));
    document.addEventListener('mouseup', this.selectionEnd.bind(this));

    this.elementRef.nativeElement.addEventListener('dblclick', this.startEditing.bind(this));

    this.elementRef.nativeElement.addEventListener('keydown', this.moveFocus.bind(this));
  }
  
  fixedWidth: number = 0;
  totalWidth: number = 0;
  scrollbarWidth: number = 0;
  @ViewChild('fixedHeader') fixedHeaderRowRef: ElementRef;
  @ViewChild('header') headerRowRef: ElementRef;
  @ViewChild('fixedScroll') fixedScrollRef: ElementRef;
  @ViewChild('headerScroll') headerScrollRef: ElementRef;
  @ViewChild('tableScroll') tableScrollRef: ElementRef;
  resizeColHeaders() {
    const fixedHeaderTds = this.fixedHeaderRowRef.nativeElement.querySelectorAll('td');
    const fixedCellTds = this.fixedScrollRef.nativeElement.querySelector('tr').querySelectorAll('td');
    const headerTds = this.headerRowRef.nativeElement.querySelectorAll('td');
    const dataCellTds = this.tableScrollRef.nativeElement.querySelector('tr').querySelectorAll('td');
    
    this.scrollbarWidth = this.headerScrollRef.nativeElement.clientWidth - this.tableScrollRef.nativeElement.clientWidth;

    for (let idx=0; idx<this.columns.length; idx++) {
      const header = headerTds[idx];
      const dataCell = dataCellTds[idx];
      if (!this.columns[idx].width) {
        this.columns[idx].renderedWidth = Math.max(header.offsetWidth, dataCell.offsetWidth);
      }
      this.totalWidth += this.columns[idx].renderedWidth;
      }
    for (let idx=0; idx<this.fixedColumns.length; idx++) {
      const header = fixedHeaderTds[idx];
      const dataCell = fixedCellTds[idx];
      if (!this.fixedColumns[idx].width) {
        this.fixedColumns[idx].renderedWidth = Math.max(header.offsetWidth, dataCell.offsetWidth);
      }
      this.fixedWidth += this.fixedColumns[idx].renderedWidth;
    }
  }

  headerHeight: number = 0;
  rowHeights: number[] = [];
  resizeRowHeaders() {
    const fixedCellTrs = this.fixedScrollRef.nativeElement.querySelectorAll('tr');
    const dataCellTrs = this.tableScrollRef.nativeElement.querySelectorAll('tr');

    const fixedHeaderTr = this.fixedHeaderRowRef.nativeElement;
    const headerTr = this.headerRowRef.nativeElement;
    this.headerHeight = Math.max(fixedHeaderTr.offsetHeight, headerTr.offsetHeight);

    for (let idx=0; idx<fixedCellTrs.length; idx++) {
      this.rowHeights[idx] = Math.max(fixedCellTrs[idx].offsetHeight, dataCellTrs[idx].offsetHeight);
    }
  }
  onScroll(event) {
    this.headerScrollRef.nativeElement.scrollLeft = event.target.scrollLeft;
    this.fixedScrollRef.nativeElement.scrollTop = event.target.scrollTop;
  }
  
  focusCell: any;
  currentSelection: any;
  selectionRanges: any[] = [];
  selectionCols: boolean[] = [];
  selectionRows: boolean [] = [];
  selectionCells: boolean[][] = [[]];
  initSelectionGrid() {
    this.selectionCells = this.data.map(row => this.columns.map(col => false));
    this.selectionCols = this.columns.map(col => false);
    this.selectionRows = this.data.map(row => false);
    this.selectionRanges = [];
  }
  getSelectionTarget(event) {
    let target = event.target;
    while (target && target != this.elementRef.nativeElement && target.tagName != "TD" && !target.classList.contains("ge-no-select")) {
      target = target.parentNode;
    }
    return target;
  }
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
    this.cdr.detectChanges();
  }
  deselect() {
    for (let col=0; col<this.columns.length; col++) {
      for (let row=0; row<this.selectionCells.length; row++) {
        this.selectionCells[row][col] = false;
      }
      this.selectionCols[col] = false;
    }
    for (let row=0; row<this.selectionRows.length; row++) {
      this.selectionRows[row] = false;
    }
    this.selectionRanges = [];
    this.editingCell = null;
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

  @ViewChild('grid') gridRef: ElementRef;
  moveFocus(event) {
    if (this.editingCell || !this.focusCell) {
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
      if (col >= this.data[row].length - 1) return;
      newFocusCell = this.getOffset(row, col + 1);
    }
    if (newFocusCell) {
      this.focusCell = newFocusCell;
      this.gridRef.nativeElement.focus();
      this.scrollCellToView(this.focusCell);
      this.setSelectionRange(this.createSelection(this.focusCell, this.focusCell, "cell"));
    }
  }
  scrollCellToView(target) {
    const scrollRef = this.tableScrollRef.nativeElement;
    if (target.left < scrollRef.scrollLeft) {
      scrollRef.scrollLeft = target.left;
    } else {
      const scrollRight = target.left + target.width - (scrollRef.scrollLeft + scrollRef.clientWidth);
      if (scrollRight > 0) {
        scrollRef.scrollLeft += scrollRight;
      }
    }
  }

  @Output('onEditStart') onEditEmitter = new EventEmitter();
  editingCell: any;
  startEditing(event) {
    const target = this.getSelectionTarget(event);
    if (target && target.tagName == "TD" && target.dataset.type == "cell") {
      this.editingCell = {
        row: parseInt(target.parentNode.dataset.row),
        col: parseInt(target.dataset.col),
      };
      this.cdr.detectChanges();
      setTimeout(() => {
        this.onEditEmitter.emit({
          row: this.data[this.editingCell.row],
          col: this.columns[this.editingCell.col],
          target: target,
        });
      }, 1);
    }
  }
}

import { Component, Input, Output, EventEmitter, ContentChildren, ViewChild, QueryList, ElementRef, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';

import { GridColumnComponent } from './grid-column.component';

@Component({
  selector: 'grid-editor',
  templateUrl: './grid-editor.component.html',
  styleUrls: ['./grid-editor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GridEditorComponent implements AfterViewInit {
  @Input() data: any[];
  @ContentChildren(GridColumnComponent) columns: QueryList<GridColumnComponent>;
  
  constructor(private elementRef: ElementRef, private cdr: ChangeDetectorRef) {}
  
  ngAfterViewInit() {
    this.initSelectionGrid();
    this.resizeColHeaders();
    this.cdr.detectChanges();
    
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
  
  colWidths: number[] = [];
  totalWidth: number = 0;
  scrollbarWidth: number = 0;
  @ViewChild('header') headerRowRef: ElementRef;
  @ViewChild('headerScroll') headerScrollRef: ElementRef;
  @ViewChild('tableScroll') tableScrollRef: ElementRef;
  resizeColHeaders() {
    const headerTds = this.headerRowRef.nativeElement.querySelectorAll('td');
    const dataCellTds = this.tableScrollRef.nativeElement.querySelector('tr').querySelectorAll('td');
    this.scrollbarWidth = this.headerScrollRef.nativeElement.clientWidth - this.tableScrollRef.nativeElement.clientWidth;
    headerTds.forEach((header, idx) => {
      const dataCell = dataCellTds[idx];
      const maxWidth = Math.max(header.clientWidth, dataCell.clientWidth);
      // skip last col since that can just fill in rest of space
      // using width='auto'
      if (idx < headerTds.length - 1) {
        this.colWidths[idx] = maxWidth;
      }
      this.totalWidth += maxWidth;
    });
  }
  onScroll(event) {
    this.headerScrollRef.nativeElement.scrollLeft = event.target.scrollLeft;
  }
  
  focusCell: any;
  currentSelection: any;
  selectionRanges: any[] = [];
  selectionCols: boolean[] = [];
  selectionCells: boolean[][] = [[]];
  initSelectionGrid() {
    this.selectionCells = this.data.map(row => this.columns.map(col => false));
    this.selectionCols = this.columns.map(col => false);
    this.selectionRanges = [];
  }
  getSelectionTarget(event) {
    let target = event.target;
    while (target && target != this.elementRef.nativeElement && target.tagName != "TD") {
      target = target.parentNode;
    }
    return target;
  }
  selectionStart(event) {
    const target = this.getSelectionTarget(event);
    if (target.tagName == "TD") {
      this.focusCell = target;
      this.currentSelection = this.createSelection(target);
      this.setSelectionRange(this.currentSelection);
    }
  }
  createSelection(target) {
    let selection: any = {
      type: target.dataset.type
    };
    selection.startCell = target;
    selection.endCell = target;
    if (target.dataset.type == "cell") {
      selection.startRow = parseInt(target.parentNode.dataset.row);
      selection.endRow = parseInt(target.parentNode.dataset.row);
    }
    // else col selection
    selection.startCol = parseInt(target.dataset.col);
    selection.endCol = parseInt(target.dataset.col);
    return selection;
  }
  selectionMove(event) {
    if (!this.currentSelection) {
      return;
    }
    const target = this.getSelectionTarget(event);
    if (target.tagName == "TD" && this.currentSelection.endCell != target) {
      if (this.currentSelection.type == "cell" && target.dataset.type != "cell") {
        return;
      }
      this.currentSelection.endCell = target;
      if (this.currentSelection.type == "cell") {
        this.currentSelection.endRow = parseInt(target.parentNode.dataset.row);
      }
      this.currentSelection.endCol = parseInt(target.dataset.col);
      this.setSelectionRange(this.currentSelection);
    }
  }
  selectionEnd(event) {
    this.currentSelection = null;
  }
  setSelectionRange(range) {
    this.deselect();

    range.top = Math.min(range.startCell.offsetTop, range.endCell.offsetTop);
    range.left = Math.min(range.startCell.offsetLeft, range.endCell.offsetLeft);
    if (range.startCell.offsetLeft < range.endCell.offsetLeft) {
      range.width = range.endCell.offsetLeft - range.startCell.offsetLeft + range.endCell.offsetWidth;
    } else {
      range.width = range.startCell.offsetLeft - range.endCell.offsetLeft + range.startCell.offsetWidth;
    }
    if (range.startCell.offsetTop <= range.endCell.offsetTop) {
      range.height = range.endCell.offsetTop - range.startCell.offsetTop + range.endCell.offsetHeight;
    } else {
      range.height = range.startCell.offsetTop - range.endCell.offsetTop + range.startCell.offsetHeight;
    }
    this.selectionRanges = [range];

    let minRow, maxRow; 
    if (range.type == "cell") {
      minRow = Math.min(range.startRow, range.endRow);
      maxRow = Math.max(range.startRow, range.endRow);
    } else {
      // else col selection
      minRow = 0;
      maxRow = this.data.length - 1;
    }
    const minCol = Math.min(range.startCol, range.endCol);
    const maxCol = Math.max(range.startCol, range.endCol);
    for (let rowIdx = minRow; rowIdx <= maxRow; rowIdx++) {
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
      this.selectionCols[col] = false
    }
    this.selectionRanges = [];
  }

  moveFocus(event) {
    const row = parseInt(this.focusCell.parentNode.dataset.row);
    const col = parseInt(this.focusCell.dataset.col);
    let newFocusCell;
    if (event.key == "ArrowUp" || event.key == "Up") {
      if (row <= 0) return;
      const table = this.focusCell.parentNode.parentNode;
      newFocusCell = table.children[row - 1].children[col];
    } else if (event.key == "ArrowDown" || event.key == "Down") {
      if (row >= this.data.length - 1) return;
      const table = this.focusCell.parentNode.parentNode;
      newFocusCell = table.children[row + 1].children[col];
    } else if (event.key == "ArrowLeft" || event.key == "Left") {
      if (col <= 0) return;
      const rowEl = this.focusCell.parentNode;
      newFocusCell = rowEl.children[col - 1];
    } else if (event.key == "ArrowRight" || event.key == "Right") {
      if (col >= this.data[row].length - 1) return;
      const rowEl = this.focusCell.parentNode;
      newFocusCell = rowEl.children[col + 1];
    }
    if (newFocusCell) {
      this.focusCell = newFocusCell;
      this.setSelectionRange(this.createSelection(this.focusCell));
    }
  }

  @Output('onEditStart') onEditEmitter = new EventEmitter();
  editingCell: any = {};
  startEditing(event) {
    const target = this.getSelectionTarget(event);
    if (target.tagName == "TD" && target.dataset.type == "cell") {
      this.editingCell = {
        row: parseInt(target.parentNode.dataset.row),
        col: parseInt(target.dataset.col),
      };
      this.cdr.detectChanges();
      setTimeout(() => {
        this.onEditEmitter.emit({
          row: this.data[this.editingCell.row],
          col: this.columns.toArray()[this.editingCell.col],
          target: target,
        });
      }, 1);
    }
  }
}

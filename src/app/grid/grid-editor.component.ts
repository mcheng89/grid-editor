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
  selectionRanges: any[] = [];
  selectionCols: boolean[] = [];
  selectionRows: boolean [] = [];
  selectionCells: boolean[][] = [[]];

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
      if (col >= this.columns.length - 1) return;
      newFocusCell = this.getOffset(row, col + 1);
    }
    if (newFocusCell) {
      this.focusCell = newFocusCell;
      this.gridRef.nativeElement.focus();
      this.scrollCellToView(this.focusCell);
      // this.setSelectionRange(this.createSelection(this.focusCell, this.focusCell, "cell"));
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
    if (target.top < scrollRef.scrollTop) {
      scrollRef.scrollTop = target.top;
    } else {
      const scrollBottom = target.top + target.height - (scrollRef.scrollTop + scrollRef.clientHeight);
      if (scrollBottom > 0) {
        scrollRef.scrollTop += scrollBottom;
      }
    }
  }

  setSelection(event) {
    this.editingCell = null;
    this.selectionRanges = event.ranges;
    this.selectionCols = event.cols;
    this.selectionRows = event.rows;
    this.selectionCells = event.cells;
  }

  getSelectionTarget(event) {
    let target = event.target;
    while (target && target != this.elementRef.nativeElement && target.tagName != "TD" && !target.classList.contains("ge-no-select")) {
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

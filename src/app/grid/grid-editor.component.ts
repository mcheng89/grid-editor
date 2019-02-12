import { Component, Input, Output, EventEmitter, ContentChildren, ViewChild, QueryList, ElementRef, AfterContentInit, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';

import { GridColumnComponent } from './grid-column.component';
import { GridSelectionService } from './grid-selection.service';

@Component({
  selector: 'grid-editor',
  templateUrl: './grid-editor.component.html',
  styleUrls: ['./grid-editor.component.scss'],
  providers: [GridSelectionService],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GridEditorComponent implements AfterContentInit, AfterViewInit {
  @Input() data: any[];
  @ContentChildren(GridColumnComponent) columnRefs: QueryList<GridColumnComponent>;
  columns: GridColumnComponent[] = [];
  fixedColumns: GridColumnComponent[] = [];
  
  constructor(public elementRef: ElementRef, private cdr: ChangeDetectorRef) {}
  
  ngAfterContentInit() {
    this.columns = this.columnRefs.filter(col => !col.fixed);
    this.fixedColumns = this.columnRefs.filter(col => col.fixed);
  }
  ngAfterViewInit() {
    this.resizeColHeaders();
    setTimeout(() => {
      this.resizeRowHeaders();
      this.cdr.detectChanges();
    });
    
    this.elementRef.nativeElement.addEventListener('selectstart', (event) => {
      event.preventDefault();
    });
    this.tableScrollRef.nativeElement.addEventListener('scroll', this.onScroll.bind(this));
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
  totalHeight: number = 0;
  rowHeights: number[] = [];
  resizeRowHeaders() {
    const fixedCellTrs = this.fixedScrollRef.nativeElement.querySelectorAll('tr');
    const dataCellTrs = this.tableScrollRef.nativeElement.querySelectorAll('tr');

    const fixedHeaderTr = this.fixedHeaderRowRef.nativeElement;
    const headerTr = this.headerRowRef.nativeElement;
    this.headerHeight = Math.max(fixedHeaderTr.offsetHeight, headerTr.offsetHeight);

    this.rowHeights = [];
    this.totalHeight = 0;
    for (let idx=0; idx<fixedCellTrs.length - 1; idx++) {
      this.rowHeights[idx] = Math.max(fixedCellTrs[idx].offsetHeight, dataCellTrs[idx].offsetHeight);
      this.totalHeight += this.rowHeights[idx];
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

  @Output() selection = new EventEmitter<any>();

  @ViewChild('grid') gridRef: ElementRef;
  onSelection(event) {
    // console.log(event)
    this.selectionRanges = event.ranges;
    this.selectionCols = event.cols;
    this.selectionRows = event.rows;
    this.selectionCells = event.cells;

    if (document.activeElement != this.gridRef.nativeElement) {
      this.gridRef.nativeElement.focus();
    }
    this.focusCell = event.focus;
    this.scrollCellToView(this.focusCell);

    this.selection.emit(event);
  }

  @Output('onEditStart') onEditStart = new EventEmitter();
  editingCell: any;
  onEditCell(event) {
    this.editingCell = event;
    if (event) {
      this.cdr.detectChanges();
      setTimeout(() => {
        const dataCellTrs = this.tableScrollRef.nativeElement.querySelectorAll('tr');
        const target = dataCellTrs[event.row].children[event.col];
        this.onEditStart.emit({
          row: this.data[event.row],
          col: this.columns[event.col],
          target: target,
        });
      }, 1);
    }
  }

  onDataChange(rows) {
    // resize row height after editing a cell
    this.totalHeight = 0;
    rows.forEach(row => {
      this.rowHeights[row] = null;
    });
    setTimeout(() => {
      this.resizeRowHeaders();
      this.cdr.detectChanges();
    });
  }
}

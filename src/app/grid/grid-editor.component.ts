import { Component, Input, Output, EventEmitter, ContentChildren, ViewChild, QueryList, ElementRef, AfterContentInit, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, OnChanges, SimpleChanges } from '@angular/core';

import { GridColumnComponent } from './grid-column.component';
import { GridSelectionService } from './grid-selection.service';
import { GridEditorService } from './grid-editor.service';

@Component({
  selector: 'grid-editor',
  templateUrl: './grid-editor.component.html',
  styleUrls: ['./grid-editor.component.scss'],
  providers: [GridEditorService, GridSelectionService],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GridEditorComponent implements AfterContentInit, AfterViewInit, OnChanges {
  @Input() data: any[];
  @Input() rowCssCls: string[];
  @ContentChildren(GridColumnComponent) columnRefs: QueryList<GridColumnComponent>;
  columns: GridColumnComponent[] = [];
  fixedColumns: GridColumnComponent[] = [];
  
  constructor(public elementRef: ElementRef, private cdr: ChangeDetectorRef, private gridSvc: GridEditorService) {
    this.gridSvc.onColumnVisibilityChanging().subscribe(_ => this.updateColumnsVisible());
  }
  
  initialized: boolean = false;
  ngAfterContentInit() {
    this.columns = this.columnRefs.filter(col => !col.fixed);
    this.fixedColumns = this.columnRefs.filter(col => col.fixed);

    this.columnRefs.changes.subscribe(() => this.updateColumns());
  }
  ngAfterViewInit() {
    this.resizeColHeaders();
    this.updateRows();
    this.initialized = true;
    
    this.elementRef.nativeElement.addEventListener('selectstart', (event) => {
      event.preventDefault();
    });
    this.tableScrollRef.nativeElement.addEventListener('scroll', this.onScroll.bind(this));
  }
  ngOnChanges(changes: SimpleChanges) {
    if (this.initialized && changes.data) {
      this.updateRows();
      this.cdr.detectChanges();
    }
  }
  updateColumns() {
    this.columns = this.columnRefs.filter(col => !col.fixed && col.visible !== false);
    this.fixedColumns = this.columnRefs.filter(col => col.fixed);

    this.totalWidth = 0;
    this.fixedWidth = 0;
    setTimeout(() => {
      this.resizeColHeaders();
      this.updateRows();
      this.cdr.detectChanges();
    });
  }
  updateColumnsVisible() {
    if (this.columnRefs.find(col => col.visible !== false && !col.renderedWidth)) {
      this.updateColumns();
    } else {
      this.columns = this.columnRefs.filter(col => !col.fixed && col.visible !== false);
      this.totalWidth = this.columns.map(col => col.renderedWidth).reduce((sum, width) => sum += width, 0);
    }
    this.cdr.detectChanges();
  }
  updateRows() {
    this.headerHeight = 0;
    this.rowHeights = [];
    this.rowTops = [];
    setTimeout(() => {
      this.resizeRowHeaders();
      this.cdr.detectChanges();
    });
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
  rowTops: number[] = [];
  resizeRowHeaders() {
    const fixedCellTrs = this.fixedScrollRef.nativeElement.querySelectorAll('tr');
    const dataCellTrs = this.tableScrollRef.nativeElement.querySelectorAll('tr');

    const fixedHeaderTr = this.fixedHeaderRowRef.nativeElement;
    const headerTr = this.headerRowRef.nativeElement;
    this.headerHeight = Math.max(fixedHeaderTr.offsetHeight, headerTr.offsetHeight);

    this.rowHeights = [];
    for (let idx=0; idx<fixedCellTrs.length - 1; idx++) {
      this.rowHeights[idx] = Math.max(fixedCellTrs[idx].offsetHeight, dataCellTrs[idx].offsetHeight);
    }

    setTimeout(() => this.calcRowPositions());
  }
  calcRowPositions() {
    const dataCellTrs = this.tableScrollRef.nativeElement.querySelectorAll('tr');

    this.rowTops = [];
    for (let idx=0; idx<dataCellTrs.length; idx++) {
      this.rowTops[idx] = dataCellTrs[idx].offsetTop;
    }
    this.cdr.detectChanges();
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

    this.selection.emit(event);
  }
  onFocus(event) {
    // console.log(event);
    this.focusCell = event;
    this.scrollCellToView(this.focusCell);
  }

  @Output('onEditStart') onEditStart = new EventEmitter();
  editingCell: any;
  onEditCell(event) {
    this.editingCell = event;
    if (event) {
      this.cdr.detectChanges();
      setTimeout(() => {
        this.onEditStart.emit({
          row: this.data[event.row],
          col: this.columns[event.col],
          target: event.element,
        });
      }, 1);
    }
  }

  @Output('onDataCopy') dataCopy = new EventEmitter();
  onDataCopy(event) {
    this.dataCopy.emit(event);
  }

  onDataChange(rows) {
    // resize row height after editing a cell
    rows.forEach(row => {
      this.rowHeights[row] = null;
    });
    setTimeout(() => {
      this.resizeRowHeaders();
      this.cdr.detectChanges();
    });
  }
}

import { Component, Input, Output, EventEmitter, ContentChildren, ViewChild, QueryList, ElementRef, AfterContentInit, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, OnChanges, SimpleChanges } from '@angular/core';

import { GridColumnComponent } from './grid-column.component';
import { GridSelectionService } from './grid-selection.service';
import { GridEditorService } from './grid-editor.service';

import { Subject, Observable } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'grid-editor',
  templateUrl: './grid-editor.component.html',
  styleUrls: ['./grid-editor.component.scss'],
  providers: [GridEditorService, GridSelectionService],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GridEditorComponent implements AfterContentInit, AfterViewInit, OnChanges {
  @ViewChild('grid') gridRef: ElementRef;
  
  @Input() data: any[];
  @Input() rowCssCls: string[];
  @ContentChildren(GridColumnComponent) columnRefs: QueryList<GridColumnComponent>;
  columns: GridColumnComponent[] = [];
  fixedColumns: GridColumnComponent[] = [];

  rowUpdate = new Subject();
  
  constructor(private cdr: ChangeDetectorRef, private gridSvc: GridEditorService) {
    this.gridSvc.onColumnVisibilityChanging().subscribe(_ => this.updateColumnsVisible());

    this.rowUpdate.pipe(debounceTime(10)).subscribe(() => {
      console.log("updateRows inside");
      this.resizeRowHeaders();
      this.cdr.detectChanges();
    })
  }
  
  initialized: boolean = false;
  ngAfterContentInit() {
    this.columns = this.columnRefs.filter(col => !col.fixed);
    this.fixedColumns = this.columnRefs.filter(col => col.fixed);

    this.columnRefs.changes.subscribe(() => this.updateColumns());
  }
  ngAfterViewInit() {
    this.calculateScrollbarWidth();
    this.resizeColHeaders();
    this.updateRows();
    this.initialized = true;
    
    this.gridRef.nativeElement.addEventListener('selectstart', (event) => {
      event.preventDefault();
    });
    this.tableScrollRef.nativeElement.addEventListener('scroll', this.onScroll.bind(this));
  }
  ngOnChanges(changes: SimpleChanges) {
    if (this.initialized && changes.data) {
      this.updateRows();
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
  updateColumnSizes(sizeEnd) {
    this.totalWidth = this.columns.map(col => col.renderedWidth).reduce((sum, width) => sum += width, 0);
    if (sizeEnd) {
      this.updateRows();
    }
    this.cdr.detectChanges();
  }
  resetColumnSizing() {
    this.columnRefs.forEach(col => col.renderedWidth = col.width || 0);
    this.updateColumns();
    this.cdr.detectChanges();
  }
  updateRows() {
    this.headerHeight = 0;
    this.rowHeights = [];
    this.rowTops = [];
    this.rowUpdate.next();
  }
  
  fixedWidth: number = 0;
  totalWidth: number = 0;
  scrollbarWidth: number = 0;
  @ViewChild('topLeft') topLeftRef: ElementRef;
  @ViewChild('fixedHeader') fixedHeaderRowRef: ElementRef;
  @ViewChild('header') headerRowRef: ElementRef;
  @ViewChild('fixedScroll') fixedScrollRef: ElementRef;
  @ViewChild('headerScroll') headerScrollRef: ElementRef;
  @ViewChild('tableScroll') tableScrollRef: ElementRef;
  resizeColHeaders() {
    const fixedHeaderTds = this.fixedHeaderRowRef.nativeElement.getElementsByTagName('td');
    const fixedCellTds = this.fixedScrollRef.nativeElement.getElementsByTagName('tr')[0].getElementsByTagName('td');
    const headerTds = this.headerRowRef.nativeElement.getElementsByTagName('td');
    const dataCellTds = this.tableScrollRef.nativeElement.getElementsByTagName('tr')[0].getElementsByTagName('td');

    this.totalWidth = 0;
    for (let idx=0; idx<this.columns.length; idx++) {
      const header = headerTds[idx];
      const dataCell = dataCellTds[idx];
      if (!this.columns[idx].renderedWidth) {
        // add +1 for ie11 decimal rounding
        this.columns[idx].renderedWidth = Math.max(header.offsetWidth, dataCell.offsetWidth, this.columns[idx].minWidth) + 1;
      }
      this.totalWidth += this.columns[idx].renderedWidth;
    }
    this.fixedWidth = 0;
    for (let idx=0; idx<this.fixedColumns.length; idx++) {
      const header = fixedHeaderTds[idx];
      const dataCell = fixedCellTds[idx];
      if (this.fixedColumns[idx].renderedWidth) {
        // add +1 for ie11 decimal rounding
        this.fixedColumns[idx].renderedWidth = Math.max(header.offsetWidth, dataCell.offsetWidth, this.fixedColumns[idx].minWidth) + 1;
      }
      this.fixedWidth += this.fixedColumns[idx].renderedWidth;
    }
  }
  calculateScrollbarWidth() {
    const outer = document.createElement("div");
    outer.style.visibility = "hidden";
    outer.style.width = "100px";
    document.body.appendChild(outer);
    const widthNoScroll = outer.offsetWidth;

    outer.style.overflow = "scroll";
    const inner = document.createElement("div");
    inner.style.width = "100%";
    outer.appendChild(inner);        
    const widthWithScroll = inner.offsetWidth;

    // remove divs
    outer.parentNode.removeChild(outer);

    this.scrollbarWidth = widthNoScroll - widthWithScroll;
  }

  headerHeight: number = 0;
  rowHeights: number[] = [];
  rowTops: number[] = [];
  resizeRowHeaders() {
    const fixedCellTrs = this.fixedScrollRef.nativeElement.getElementsByTagName('tr');
    const dataCellTrs = this.tableScrollRef.nativeElement.getElementsByTagName('tr');

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
    const dataCellTrs = this.tableScrollRef.nativeElement.getElementsByTagName('tr');

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
  onSelection(event) {
    // console.log(event)
    this.selectionRanges = event.ranges;
    this.selectionCols = event.cols;
    this.selectionRows = event.rows;
    this.selectionCells = event.cells;

    if (document.activeElement != this.gridRef.nativeElement && !this.editingCell) {
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
  @Output('onBeforePaste') beforePaste = new EventEmitter();
  @Output('onDataChange') dataChange = new EventEmitter();

  onDataChange(event) {
    // resize row height after editing a cell
    event.changes.forEach(rowChange => {
      this.rowHeights[rowChange.row] = null;
    });

    this.dataChange.emit(event);
    if (event.cancelRefresh) {
      return;
    }

    setTimeout(() => {
      this.resizeRowHeaders();
      this.cdr.detectChanges();
    });
  }
}

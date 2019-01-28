import { Component, Input, Output, EventEmitter, ContentChildren, ViewChild, QueryList, ElementRef, AfterViewInit, NgZone } from '@angular/core';

import { GridColumnComponent } from './grid-column.component';

@Component({
  selector: 'grid-editor',
  templateUrl: './grid-editor.component.html',
  styleUrls: ['./grid-editor.component.scss']
})
export class GridEditorComponent implements AfterViewInit {
  @Input() data: any[];
  @ContentChildren(GridColumnComponent) columns: QueryList<GridColumnComponent>;
  
  constructor(private elementRef: ElementRef, private zone: NgZone) {}
  
  ngAfterViewInit() {
    this.initSelectionGrid();
    this.resizeColHeaders();
    
    this.zone.runOutsideAngular(() => {
      this.elementRef.nativeElement.addEventListener('selectstart', (event) => {
        event.preventDefault();
      });
      this.tableScrollRef.nativeElement.addEventListener('scroll', this.onScroll.bind(this));

      this.elementRef.nativeElement.addEventListener('mousedown', this.selectionStart.bind(this));
      this.elementRef.nativeElement.addEventListener('mousemove', this.selectionMove.bind(this));
      document.addEventListener('mouseup', this.selectionEnd.bind(this));
  
      this.elementRef.nativeElement.addEventListener('dblclick', this.startEditing.bind(this));
    });
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
      this.currentSelection = {
        type: target.dataset.type
      };
      this.currentSelection.startCell = target;
      this.currentSelection.endCell = target;
      if (target.dataset.type == "cell") {
        this.currentSelection.startRow = parseInt(target.parentNode.dataset.row);
        this.currentSelection.endRow = parseInt(target.parentNode.dataset.row);
      }
      // else col selection
      this.currentSelection.startCol = parseInt(target.dataset.col);
      this.currentSelection.endCol = parseInt(target.dataset.col);
      
      this.zone.run(() => {
        this.selectionRanges = [this.currentSelection];
        this.setSelectionRange(this.currentSelection);
      });
    }
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

      this.zone.run(() => {
        this.setSelectionRange(this.currentSelection);
      });
    }
  }
  selectionEnd(event) {
    this.currentSelection = null;
  }
  setSelectionRange(range) {
    this.deselect();

    let minRow, maxRow; 
    if (range.type == "cell") {
      minRow = range.startRow < range.endRow ? range.startRow : range.endRow;
      maxRow = range.startRow > range.endRow ? range.startRow : range.endRow;
    } else {
      // else col selection
      minRow = 0;
      maxRow = this.data.length - 1;
    }
    const minCol = range.startCol < range.endCol ? range.startCol : range.endCol;
    const maxCol = range.startCol > range.endCol ? range.startCol : range.endCol;
    for (let rowIdx = minRow; rowIdx <= maxRow; rowIdx++) {
      for (let colIdx = minCol; colIdx <= maxCol; colIdx++) {
        this.selectionCells[rowIdx][colIdx] = true;
        this.selectionCols[colIdx] = true;
      }
    }
  }
  deselect() {
    this.initSelectionGrid();
  }

  @Output('onEditStart') onEditEmitter = new EventEmitter();
  editingCell: any = {};
  startEditing(event) {
    const target = this.getSelectionTarget(event);
    if (target.tagName == "TD" && target.dataset.type == "cell") {
      this.zone.run(() => {
        this.editingCell = {
          row: parseInt(target.parentNode.dataset.row),
          col: parseInt(target.dataset.col),
        };
        setTimeout(() => {
          this.onEditEmitter.emit({
            row: this.data[this.editingCell.row],
            col: this.columns.toArray()[this.editingCell.col],
            target: target,
          });
        }, 1);
      });
    }
  }
}

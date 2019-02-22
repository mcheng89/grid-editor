import { Component, Input, Output, EventEmitter, AfterViewInit, ElementRef } from '@angular/core';

import { GridColumnComponent } from './grid-column.component';
import { GridSelectionService } from './grid-selection.service';

import * as SheetClip from 'sheetclip';

@Component({
  selector: 'grid-editing',
  template: '',
})
export class GridEditingComponent implements AfterViewInit {
  @Input() gridElementRef: ElementRef;
  @Input() data: any[];
  @Input() columns: GridColumnComponent[];
  @Input() selectionRanges: any[] = [];
  @Input() editingCell: any;

  @Output() dataChange = new EventEmitter<any>();
  @Output() editCellChange = new EventEmitter<any>();
  @Output() dataCopy = new EventEmitter<any>();

  constructor(private gridSelectionSvc: GridSelectionService) {
    // prevent keyboard focus change when editing...
    this.gridSelectionSvc.onKeyboardFocusChanging().subscribe(event => {
      event.cancel = this.editingCell;
    });

    this.gridSelectionSvc.onFocusChange(this).subscribe(event => {
      if (this.editingCell) {
        this.editDataChange();
        this.editCellChange.emit(null);
      }
    });
  }

  ngAfterViewInit() {
    this.gridElementRef.nativeElement.addEventListener('dblclick', this.startEditing.bind(this));

    this.gridElementRef.nativeElement.addEventListener('keydown', this.editingHotkeys.bind(this));

    // document.addEventListener('copy', this.copySelection.bind(this));
    document.addEventListener('paste', this.pasteClipboard.bind(this));
  }

  startEditing(event) {
    const target = this.getEditTarget(event.target);
    if (target) {
      this.setEditTarget({
        row: parseInt(target.parentNode.dataset.row),
        col: parseInt(target.dataset.col),
        element: target,
      });
    }
  }
  setEditTarget(target) {
    if (!target.element) {
      this.editCellChange.emit(null);
    } else {
      target.data = this.data[target.row];
      target.column = this.columns[target.col];
      target.value = target.data[target.column.dataField];
      this.editCellChange.emit(target);
    }
  }
  editDataChange() {
    const oldValue = this.editingCell.data[this.editingCell.column.dataField];
    const newValue = this.editingCell.value;
    if (oldValue != newValue) {
      this.editingCell.data[this.editingCell.column.dataField] = this.editingCell.value;
      this.dataChange.emit([this.editingCell.row]);
    }
  }

  getEditTarget(target) {
    while (target && target != this.gridElementRef.nativeElement && target.tagName != "TD" && !target.classList.contains("ge-no-edit")) {
      target = target.parentNode;
    }
    if (target && (target.tagName != "TD" || target.dataset.type != "cell")) {
      return null;
    }
    if (target && (target.classList.contains("ge-no-edit") || target.parentElement.classList.contains("ge-no-edit"))) {
      return null;
    }
    return target;
  }
  getOffsetEditTarget(target) {
    const dataCellTrs = this.gridElementRef.nativeElement.querySelector(".data-table").querySelectorAll('tr');
    const domTarget = dataCellTrs[target.row].children[target.col];
    return this.getEditTarget(domTarget);
  }

  editingHotkeys(event) {
    if (this.editingCell) {
      if (event.key == "Tab") {
        let target;
        if (event.shiftKey && this.editingCell.col > 0) {
          target = {row: this.editingCell.row, col: this.editingCell.col - 1};
        } else if (!event.shiftKey && this.editingCell.col < this.columns.length - 1) {
          target = {row: this.editingCell.row, col: this.editingCell.col + 1};
        }
        if (target) {
          target.element = this.getOffsetEditTarget(target);
          this.gridSelectionSvc.setFocusCell(this, target);
          this.editDataChange();
          this.setEditTarget(target);
        }
        event.preventDefault();
      }
    } else {
      if (event.key == "c" && event.ctrlKey) {
        this.copySelection(event);
      }
    }
  }

  isGridFocused() {
    let target = document.activeElement.parentElement;
    while (target && target != this.gridElementRef.nativeElement && !target.classList.contains("ge-no-select")) {
      target = target.parentNode as HTMLElement;
    }
    return target == this.gridElementRef.nativeElement;
  }
  copySelection(event) {
    if (this.editingCell || !this.isGridFocused()) {
      return;
    }
    event.preventDefault();
    const arr = [];
    this.selectionRanges.forEach(range => {
      for (let row = range.minRow; row <= range.maxRow; row++) {
        const rowData = [];
        for (let col = range.minCol; col <= range.maxCol; col++) {
          rowData.push(this.data[row][this.columns[col].dataField]);
        }
        arr.push(rowData);
      }
    });
    // console.log(arr);
    let copyEvent = {data: arr, selection: this.selectionRanges};
    this.dataCopy.emit(copyEvent);

    const sheetclip = new SheetClip();
    const str = sheetclip.stringify(arr);

    const windowNavigator: any = window.navigator;
    if (windowNavigator.clipboard) {
      windowNavigator.clipboard.writeText(str);
    } else {
      const _window: any = window;
      _window.clipboardData.setData('text', str);
    }
  }
  pasteClipboard(event) {
    if (this.editingCell || !this.isGridFocused()) {
      return;
    }
    event.preventDefault();

    const str = event.clipboardData.getData('text/plain');
    const sheetclip = new SheetClip();
    const arr = sheetclip.parse(str);
    console.log(arr);

    const dataCellTrs = this.gridElementRef.nativeElement.querySelector(".data-table").querySelectorAll('tr');

    const range = this.selectionRanges[0];
    const modifiedRows = [];

    const colRepeats = (range.maxCol - range.minCol + 1) % arr[0].length === 0
      ? (range.maxCol - range.minCol + 1) : arr[0].length;
    const rowRepeats = (range.maxRow - range.minRow + 1) % arr.length === 0
      ? (range.maxRow - range.minRow + 1) : arr.length;
    
    for (let row = range.minRow; row < range.minRow + rowRepeats; row++) {
      const dataCellTds = dataCellTrs[row].children;

      modifiedRows.push(row);
      for (let col = range.minCol; col < range.minCol + colRepeats; col++) {
        if (!this.getEditTarget(dataCellTds[col])) {
          continue;
        }
        const copyData = arr[row % arr.length][col % arr[0].length];
        this.data[row][this.columns[col].dataField] = copyData;
      }
    }
    this.dataChange.emit(modifiedRows);
  }
}

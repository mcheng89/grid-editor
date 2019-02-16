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

    document.addEventListener('copy', this.copySelection.bind(this));
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
    }
  }

  copySelection(event) {
    if (this.editingCell || document.activeElement.parentElement != this.gridElementRef.nativeElement) {
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
    console.log(arr);

    const sheetclip = new SheetClip();
    const str = sheetclip.stringify(arr);
    event.clipboardData.setData('text/plain', str);
  }
  pasteClipboard(event) {
    if (this.editingCell || document.activeElement.parentElement != this.gridElementRef.nativeElement) {
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
    for (let row = range.minRow; row <= range.maxRow; row++) {
      const dataCellTds = dataCellTrs[row].children;

      modifiedRows.push(row);
      for (let col = range.minCol; col <= range.maxCol; col++) {
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

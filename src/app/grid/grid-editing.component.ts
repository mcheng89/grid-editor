import { Component, Input, Output, EventEmitter, AfterViewInit, ElementRef, OnChanges, SimpleChanges } from '@angular/core';

import { GridColumnComponent } from './grid-column.component';
import { GridSelectionService } from './grid-selection.service';
import { GridEditorService } from './grid-editor.service';

import * as SheetClip from 'sheetclip';

@Component({
  selector: 'grid-editing',
  template: '',
})
export class GridEditingComponent implements AfterViewInit, OnChanges {
  @Input() gridElementRef: ElementRef;
  @Input() data: any[];
  @Input() rowCssCls: any[];
  @Input() columns: GridColumnComponent[];
  @Input() focusCell: any;
  @Input() selectionRanges: any[] = [];
  @Input() editingCell: any;

  @Output() dataChange = new EventEmitter<any>();
  @Output() editCellChange = new EventEmitter<any>();
  @Output() dataCopy = new EventEmitter<any>();
  @Output() beforePaste = new EventEmitter<any>();

  constructor(private gridSelectionSvc: GridSelectionService, private gridSvc: GridEditorService) {
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

    this.gridSvc.onColumnEditableChanged().subscribe(event => this.checkEditableOnInputChange());
  }

  initialized: boolean = false;
  ngOnChanges(changes: SimpleChanges) {
    if (this.initialized && (changes.data || changes.rowCssCls)) {
      setTimeout(() => this.checkEditableOnInputChange());
    }
  }

  checkEditableOnInputChange() {
    if (this.editingCell && !this.getOffsetEditTarget(this.editingCell)) {
      this.editCellChange.emit(null);
    }
  }

  ngAfterViewInit() {
    this.initialized = true;

    this.gridElementRef.nativeElement.addEventListener('dblclick', this.startEditing.bind(this));
    this.gridElementRef.nativeElement.addEventListener('keydown', this.editingHotkeys.bind(this));

    // document.addEventListener('copy', this.copySelection.bind(this));
    // document.addEventListener('paste', this.pasteClipboard.bind(this));
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
    // sometimes editors only set value on focus lost
    // setTimeout to get actual value...
    const currentEditCell = this.editingCell;
    this.gridElementRef.nativeElement.focus();
    setTimeout(() => {
      const oldValue = currentEditCell.data[currentEditCell.column.dataField];
      const newValue = currentEditCell.value;
      if (oldValue != newValue) {
        currentEditCell.data[currentEditCell.column.dataField] = currentEditCell.value;
        this.dataChange.emit({
          source: 'EDITOR',
          changes: [{
            row: currentEditCell.row,
            data: currentEditCell.data,
          }],
        });
      }
    });
  }

  isEditableTarget(target) {
    return target && !target.classList.contains("ge-no-edit") && !target.parentElement.classList.contains("ge-no-edit");
  }
  getEditTarget(target) {
    while (target && target != this.gridElementRef.nativeElement && target.tagName != "TD" && !target.classList.contains("ge-no-edit")) {
      target = target.parentNode;
    }
    if (target && (target.tagName != "TD" || target.dataset.type != "cell")) {
      return null;
    }
    if (target && !this.isEditableTarget(target)) {
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
        this.setNextEditCell(!event.shiftKey);
        event.preventDefault();
      } else if (event.key == "Enter") {
        this.editDataChange();
        this.editCellChange.emit(null);
      }
    } else {
      if (event.key == "c" && (event.ctrlKey || event.metaKey)) {
        this.copySelection(event);
      } else if (event.key == "v" && (event.ctrlKey || event.metaKey)) {
        this.pasteClipboard(event);
      } else if (event.key == "Enter") {
        let target: any = {
          row: this.focusCell.row,
          col: this.focusCell.col,
        };
        target.element = this.getOffsetEditTarget(target);
        this.setEditTarget(target);
      }
    }
  }

  setNextEditCell(forward) {
    const dataCellTrs = this.gridElementRef.nativeElement.getElementsByClassName("data-table")[0].getElementsByTagName('tr');

    let target: any = {row: this.editingCell.row, col: this.editingCell.col};
    for (;;) {
      if (!forward) {
        if (target.col > 0) {
          target = {row: target.row, col: target.col - 1};
        } else if (target.row != 0) {
          target = {row: target.row - 1, col: this.columns.length - 1};
        } else {
          target = null;
          break;
        }
      } else if (forward) {
        if (target.col < this.columns.length - 1) {
          target = {row: target.row, col: target.col + 1};
        } else if (target.row != this.data.length - 1) {
          target = {row: target.row + 1, col: 0};
        } else {
          target = null;
          break;
        }
      }

      const domTarget = dataCellTrs[target.row].children[target.col];
      if (this.isEditableTarget(domTarget)) {
        break;
      }
    }
    
    if (target) {
      target.element = this.getOffsetEditTarget(target);
      this.gridSelectionSvc.setFocusCell(this, target);
      this.editDataChange();
      this.setEditTarget(target);
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

    const windowNavigator: any = window.navigator;
    if (windowNavigator.clipboard) {
      windowNavigator.clipboard.readText()
        .then((text: string) => {
          const sheetclip = new SheetClip();
          const arr = sheetclip.parse(text);
          this.pasteRecords(arr);
        });
    } else {
      const _window: any = window;
      const str = _window.clipboardData.getData('text');
      const sheetclip = new SheetClip();
      const arr = sheetclip.parse(str);
      this.pasteRecords(arr);
    }
  }
  pasteRecords(arr) {
    const dataCellTrs = this.gridElementRef.nativeElement.querySelector(".data-table").querySelectorAll('tr');

    const range = this.selectionRanges[0];
    const modifiedRows = [];

    let pasteEvent = {data: arr, selection: this.selectionRanges, cancel: false};
    this.beforePaste.emit(pasteEvent);
    if (pasteEvent.cancel) {
      return;
    }

    const colRepeats = (range.maxCol - range.minCol + 1) % arr[0].length === 0
      ? (range.maxCol - range.minCol + 1) : arr[0].length;
    const rowRepeats = (range.maxRow - range.minRow + 1) % arr.length === 0
      ? (range.maxRow - range.minRow + 1) : arr.length;
    
    for (let row = range.minRow; row < range.minRow + rowRepeats; row++) {
      const dataCellTds = dataCellTrs[row].children;

      let rowChanges: any = {row: -1};
      for (let col = range.minCol; col < range.minCol + colRepeats; col++) {
        if (!this.getEditTarget(dataCellTds[col])) {
          continue;
        }
        const copyData = arr[(row - range.minRow) % arr.length][(col - range.minCol) % arr[0].length];
        this.data[row][this.columns[col].dataField] = copyData;

        rowChanges.row = row;
      }
      if (rowChanges.row !== -1) {
        rowChanges.data = this.data[row];
        modifiedRows.push(rowChanges);
      }
    }
    this.dataChange.emit({
      source: 'PASTE',
      changes: modifiedRows,
    });
  }
}

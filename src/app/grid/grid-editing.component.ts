import { Component, Input, Output, EventEmitter, AfterViewInit, ElementRef } from '@angular/core';

import { GridColumnComponent } from './grid-column.component';
import { GridSelectionService } from './grid-selection.service';

@Component({
  selector: 'grid-editing',
  template: '',
})
export class GridEditingComponent implements AfterViewInit {
  @Input() gridElementRef: ElementRef;
  @Input() columns: GridColumnComponent[];
  @Input() editingCell: any;

  @Output() editCellChange = new EventEmitter<any>();

  constructor(private gridSelectionSvc: GridSelectionService) {
    // prevent keyboard focus change when editing...
    this.gridSelectionSvc.onKeyboardFocusChanging().subscribe(event => {
      event.cancel = this.editingCell;
    });

    this.gridSelectionSvc.onFocusChange(this).subscribe(event => {
      this.editCellChange.emit(null);
    });
  }

  ngAfterViewInit() {
    this.gridElementRef.nativeElement.addEventListener('dblclick', this.startEditing.bind(this));

    this.gridElementRef.nativeElement.addEventListener('keydown', this.editingHotkeys.bind(this));
  }

  startEditing(event) {
    const target = this.getSelectionTarget(event);
    if (target && target.tagName == "TD" && target.dataset.type == "cell") {
      this.editCellChange.emit({
        row: parseInt(target.parentNode.dataset.row),
        col: parseInt(target.dataset.col),
        target: target,
      });
    }
  }

  getSelectionTarget(event) {
    let target = event.target;
    while (target && target != this.gridElementRef.nativeElement && target.tagName != "TD" && !target.classList.contains("ge-no-select")) {
      target = target.parentNode;
    }
    return target;
  }

  editingHotkeys(event) {
    if (this.editingCell) {
      console.log(event);
      if (event.key == "Tab") {
        let target;
        if (event.shiftKey && this.editingCell.col > 0) {
          target = {row: this.editingCell.row, col: this.editingCell.col - 1};
        } else if (!event.shiftKey && this.editingCell.col < this.columns.length - 1) {
          target = {row: this.editingCell.row, col: this.editingCell.col + 1};
        }
        if (target) {
          this.gridSelectionSvc.setFocusCell(this, target);
          this.editCellChange.emit(target);
        }
        event.preventDefault();
      }
    }
  }
}

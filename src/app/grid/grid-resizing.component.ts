import { Component, Input, Output, EventEmitter, AfterViewInit, ElementRef } from '@angular/core';

import { GridColumnComponent } from './grid-column.component';

@Component({
  selector: 'grid-resizing',
  template: '',
})
export class GridResizingComponent implements AfterViewInit {
  @Input() gridElementRef: ElementRef;
  @Input() columns: GridColumnComponent[];

  @Output() resize = new EventEmitter();

  ngAfterViewInit() {
    this.gridElementRef.nativeElement.addEventListener('mousedown', this.resizeStart.bind(this));
    document.addEventListener('mousemove', this.resizeMove.bind(this));
    document.addEventListener('mouseup', this.resizeEnd.bind(this));
  }

  draggedColumn: GridColumnComponent;
  prevX: number;
  resizeStart(event) {
    const target = this.getResizeTarget(event);
    if (target && target.tagName == "TD") {
      const columnIdx = parseInt(target.dataset.col);
      this.draggedColumn = this.columns[columnIdx];
      this.prevX = event.screenX;
    }
  }
  resizeMove(event) {
    if (this.draggedColumn) {
      const deltaX = event.screenX - this.prevX;
      this.prevX = event.screenX;

      if (deltaX > 0 || this.draggedColumn.renderedWidth != this.draggedColumn.minWidth) {
        this.draggedColumn.renderedWidth += deltaX;
        if (this.draggedColumn.renderedWidth < this.draggedColumn.minWidth) {
          this.draggedColumn.renderedWidth = this.draggedColumn.minWidth;
        }
        this.resize.emit(false);
      }
    }
  }
  resizeEnd(event) {
    if (this.draggedColumn) {
      this.draggedColumn = null;
      this.resize.emit(true);
    }
  }

  getResizeTarget(event) {
    let target = event.target;
    if (!target.classList.contains("resizer")) {
      return null;
    }
    while (target && target != this.gridElementRef.nativeElement && target.tagName != "TD") {
      target = target.parentNode;
    }
    return target;
  }
}

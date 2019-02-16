import { Component, Input, Output, EventEmitter, AfterViewInit, ElementRef } from '@angular/core';

import { GridColumnComponent } from './grid-column.component';

@Component({
  selector: 'grid-resizing',
  template: '',
})
export class GridResizingComponent implements AfterViewInit {
  @Input() gridElementRef: ElementRef;
  @Input() columns: GridColumnComponent[];

  ngAfterViewInit() {
    this.gridElementRef.nativeElement.addEventListener('mousedown', this.resizeStart.bind(this));
    this.gridElementRef.nativeElement.addEventListener('mousemove', this.resizeMove.bind(this));
    document.addEventListener('mouseup', this.resizeEnd.bind(this));
  }

  resizeStart(event) {
    const target = this.getResizeTarget(event);
    if (target && target.tagName == "TD") {
      const columnIdx = parseInt(target.dataset.col);
      console.log(target, columnIdx, this.columns[columnIdx]);
    }
  }
  resizeMove(event) {
  }
  resizeEnd(event) {
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

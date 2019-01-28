import { Component, Input, ContentChildren, QueryList, AfterViewInit } from '@angular/core';

import { GridTemplateDirective } from './grid-template.directive';

@Component({
  selector: 'grid-column',
  template: '',
})
export class GridColumnComponent implements AfterViewInit {
  @Input('data-field') dataField: string;
  @Input() description: string;
  
  @ContentChildren(GridTemplateDirective) templateRef: QueryList<GridTemplateDirective>;
  headerRef: any;
  
  ngAfterViewInit() {
    this.headerRef = this.templateRef.find(tpl => {
      return tpl.letOf == 'header';
    }).templateRef;
  }
}
